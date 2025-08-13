import os
import json
from collections import defaultdict

from agent.tools_and_schemas import (
    SearchQueryList, 
    RadarElementsList, 
    RadarReflection,
    RadarOutput
)
from dotenv import load_dotenv
from langchain_core.messages import AIMessage
from langgraph.types import Send
from langgraph.graph import StateGraph
from langgraph.graph import START, END
from langchain_core.runnables import RunnableConfig
from google.genai import Client

from agent.state import (
    OverallState,
    QueryGenerationState,
    RadarReflectionState,
    WebSearchState,
    RadarElementsState,
)
from agent.configuration import Configuration
from agent.prompts import (
    get_current_date,
    query_writer_instructions,
    web_searcher_instructions,
    radar_element_extraction_instructions,
    radar_reflection_instructions,
    radar_finalization_instructions,
)
from langchain_google_genai import ChatGoogleGenerativeAI
from agent.utils import (
    get_citations,
    get_research_topic,
    insert_citation_markers,
    resolve_urls,
)

load_dotenv()

# Load environment variable for API key (development fallback)
default_api_key = os.getenv("GEMINI_API_KEY")
if default_api_key:
    print("Using GEMINI_API_KEY from environment for development/testing.")
else:
    print("No environment API key found. API key must be provided via the frontend interface.")

# Used for Google Search API - will be created dynamically with user's API key
genai_client = None

def get_genai_client(config: RunnableConfig) -> Client:
    """Get the Google GenerativeAI client with API key from configuration or environment."""
    configuration = Configuration.from_runnable_config(config)
    # Prioritize API key from frontend configuration
    api_key = configuration.api_key or default_api_key
    if not api_key:
        raise ValueError("No Gemini API key provided. Please provide an API key through the frontend interface or set GEMINI_API_KEY environment variable.")
    
    return Client(api_key=api_key)

def get_api_key(config: RunnableConfig) -> str:
    """Get the API key from the configuration or environment."""
    configuration = Configuration.from_runnable_config(config)
    # Prioritize API key from frontend configuration  
    api_key = configuration.api_key or default_api_key
    if not api_key:
        raise ValueError("No Gemini API key provided. Please provide an API key through the frontend interface or set GEMINI_API_KEY environment variable.")
    return api_key


# Nodes
def generate_query(state: OverallState, config: RunnableConfig) -> QueryGenerationState:
    """LangGraph node that generates search queries for tech radar construction.

    Uses Gemini 2.0 Flash to create optimized search queries to discover
    technologies, tools, techniques, and platforms for radar construction.

    Args:
        state: Current graph state containing the radar topic
        config: Configuration for the runnable

    Returns:
        Dictionary with state update, including search_query key containing the generated queries
    """
    configurable = Configuration.from_runnable_config(config)

    # Initialize radar-specific state values
    radar_topic = state.get("radar_topic") 
    if radar_topic is None:
        radar_topic = get_research_topic(state["messages"])
    
    target_element_count = state.get("target_element_count", 25)  # Default to balanced target
    radar_elements = state.get("radar_elements", [])

    # Check for custom initial search query count
    initial_search_query_count = state.get("initial_search_query_count", configurable.number_of_initial_queries)

    # Init Gemini with user's API key
    llm = ChatGoogleGenerativeAI(
        model=configurable.query_generator_model,
        temperature=1.0,
        max_retries=2,
        api_key=get_api_key(config),
    )
    structured_llm = llm.with_structured_output(SearchQueryList)

    # Format the prompt
    current_date = get_current_date()
    formatted_prompt = query_writer_instructions.format(
        current_date=current_date,
        research_topic=radar_topic,
        number_queries=initial_search_query_count,
    )
    # Generate the search queries
    result = structured_llm.invoke(formatted_prompt)
    
    # Return state updates including initialized values
    return {
        "search_query": result.query,
        "radar_topic": radar_topic,
        "target_element_count": target_element_count,
        "radar_elements": radar_elements,
    }


def continue_to_web_research(state: QueryGenerationState):
    """LangGraph node that sends the search queries to the web research node."""
    return [
        Send("web_research", {"search_query": search_query, "id": int(idx)})
        for idx, search_query in enumerate(state["search_query"])
    ]


def web_research(state: WebSearchState, config: RunnableConfig) -> OverallState:
    """LangGraph node that performs web research for radar element discovery.

    Executes web search focused on finding technologies for radar construction.

    Args:
        state: Current graph state containing the search query
        config: Configuration for the runnable

    Returns:
        Dictionary with state update including sources and research results
    """
    # Configure
    configurable = Configuration.from_runnable_config(config)
    formatted_prompt = web_searcher_instructions.format(
        current_date=get_current_date(),
        research_topic=state["search_query"],
    )

    # Get the genai client with user's API key
    client = get_genai_client(config)
    response = client.models.generate_content(
        model=configurable.query_generator_model,
        contents=formatted_prompt,
        config={
            "tools": [{"google_search": {}}],
            "temperature": 0,
        },
    )
    # Resolve URLs and get citations
    resolved_urls = resolve_urls(
        response.candidates[0].grounding_metadata.grounding_chunks, state["id"]
    )
    citations = get_citations(response, resolved_urls)
    modified_text = insert_citation_markers(response.text, citations)
    sources_gathered = [item for citation in citations for item in citation["segments"]]

    return {
        "sources_gathered": sources_gathered,
        "search_query": [state["search_query"]],
        "web_research_result": [modified_text],
    }


def extract_radar_elements(state: OverallState, config: RunnableConfig) -> OverallState:
    """LangGraph node that extracts technology elements from research summaries.

    Analyzes research summaries to identify and classify technology elements
    that should be included in the radar. Includes smart extraction limits
    to prevent overshooting targets.

    Args:
        state: Current graph state containing research summaries
        config: Configuration for the runnable

    Returns:
        Dictionary with extracted radar elements merged with overall state
    """
    configurable = Configuration.from_runnable_config(config)
    
    # Calculate how many elements we need to avoid overshooting
    existing_elements = state.get("radar_elements", [])
    current_count = len(existing_elements)
    target_count = state.get("target_element_count", 25)
    elements_needed = max(5, target_count - current_count)  # Minimum 5, or what's needed
    
    # Use the reflection model for element extraction with user's API key
    llm = ChatGoogleGenerativeAI(
        model=configurable.reflection_model,
        temperature=0.3,
        max_retries=2,
        api_key=get_api_key(config),
    )
    
    structured_llm = llm.with_structured_output(RadarElementsList)
    
    # Format the prompt with extraction limit and real source URLs
    current_date = get_current_date()
    
    # Create a mapping of real URLs for source attribution
    source_urls_context = ""
    real_urls_mapping = {}
    
    if state.get("sources_gathered"):
        source_urls_context = "\n\nSOURCE URLS FOR REFERENCE:\n"
        unique_sources = {}
        for i, source in enumerate(state["sources_gathered"], 1):
            if hasattr(source, 'value') and source.value:
                url = source.value
                title = getattr(source, 'label', f'Source {i}')
                if url not in unique_sources:
                    unique_sources[url] = title
                    # Store real URL mapping for later use
                    real_urls_mapping[f"source_{i}"] = url
                    source_urls_context += f"[{i}] {title}: {url}\n"
        
        source_urls_context += "\n🔗 CRITICAL URL REQUIREMENTS:\n"
        source_urls_context += "- Each technology MUST include a specific, working source_url from the URLs above\n"
        source_urls_context += "- Use official project websites (tensorflow.org, pytorch.org, etc.)\n"
        source_urls_context += "- Use official GitHub repositories (github.com/project/name)\n"
        source_urls_context += "- Use official documentation sites\n"
        source_urls_context += "- NEVER use generic sites like geeksforgeeks.org, wikipedia.org\n"
        source_urls_context += "- NEVER use invalid URLs like 'github.com/github.com'\n"
        source_urls_context += "- NEVER use search placeholders or vertexaisearch URLs\n"
        source_urls_context += "- Each URL should be the PRIMARY authoritative source for that technology\n"
    
    formatted_prompt = radar_element_extraction_instructions.format(
        current_date=current_date,
        radar_topic=state["radar_topic"],
        summaries="\n\n---\n\n".join(state["web_research_result"]) + source_urls_context,
        extraction_limit=elements_needed,
        current_count=current_count,
        target_count=target_count,
    )
    
    result = structured_llm.invoke(formatted_prompt)
    
    # Debug information
    new_elements_count = len(result.elements)
    existing_count = len(existing_elements)
    
    # Merge with existing elements and deduplicate immediately
    all_elements = existing_elements + result.elements
    
    # Deduplicate by name (case-insensitive)
    unique_elements = {}
    for element in all_elements:
        if hasattr(element, 'name'):
            unique_elements[element.name.lower()] = element
        elif isinstance(element, dict):
            unique_elements[element['name'].lower()] = element
    
    final_elements = list(unique_elements.values())
    
    print(f"📊 Extracted {new_elements_count} new elements, had {existing_count} existing, total unique: {len(final_elements)}")
    
    # Return as OverallState update 
    return {
        "radar_elements": final_elements,
    }


def radar_reflection(state: OverallState, config: RunnableConfig) -> OverallState:
    """LangGraph node that analyzes radar completeness and identifies gaps.

    Evaluates whether we have sufficient radar elements and identifies
    areas needing more research.

    Args:
        state: Current graph state containing radar elements
        config: Configuration for the runnable

    Returns:
        Dictionary with reflection results and follow-up queries
    """
    configurable = Configuration.from_runnable_config(config)
    
    # Increment research loop count
    state["research_loop_count"] = state.get("research_loop_count", 0) + 1
    
    # Elements should already be deduplicated from extract_radar_elements
    existing_elements = state.get("radar_elements", [])
    current_count = len(existing_elements)
    target_count = state.get("target_element_count", 25)
    
    # Create summary of current elements for analysis
    quadrant_counts = defaultdict(int)
    ring_counts = defaultdict(int)
    
    for element in existing_elements:
        if hasattr(element, 'quadrant'):
            quadrant_counts[element.quadrant] += 1
            ring_counts[element.ring] += 1
        elif isinstance(element, dict):
            quadrant_counts[element['quadrant']] += 1
            ring_counts[element['ring']] += 1
    
    elements_summary = f"""
    Current element count: {current_count}/{target_count}
    
    Quadrant distribution:
    - Techniques: {quadrant_counts.get('Techniques', 0)}
    - Tools: {quadrant_counts.get('Tools', 0)}
    - Platforms: {quadrant_counts.get('Platforms', 0)}
    - Languages & Frameworks: {quadrant_counts.get('Languages & Frameworks', 0)}
    
    Ring distribution:
    - Adopt: {ring_counts.get('Adopt', 0)}
    - Trial: {ring_counts.get('Trial', 0)}
    - Assess: {ring_counts.get('Assess', 0)}
    - Hold: {ring_counts.get('Hold', 0)}
    """
    
    # Use reasoning model for reflection with user's API key
    reasoning_model = state.get("reasoning_model", configurable.reflection_model)
    llm = ChatGoogleGenerativeAI(
        model=reasoning_model,
        temperature=0.5,
        max_retries=2,
        api_key=get_api_key(config),
    )
    
    structured_llm = llm.with_structured_output(RadarReflection)
    
    # Format the prompt
    current_date = get_current_date()
    progress_percentage = round((current_count / target_count * 100), 1) if target_count > 0 else 0
    
    formatted_prompt = radar_reflection_instructions.format(
        current_date=current_date,
        radar_topic=state["radar_topic"],
        current_count=current_count,
        target_count=target_count,
        progress_percentage=progress_percentage,
        elements_summary=elements_summary,
    )
    
    result = structured_llm.invoke(formatted_prompt)
    
    # Return as OverallState update
    return {
        "research_loop_count": state["research_loop_count"],
        # Store reflection data for the routing function
        "_reflection_is_sufficient": result.is_sufficient,
        "_reflection_current_count": current_count,
        "_reflection_knowledge_gap": result.knowledge_gap,
        "_reflection_follow_up_queries": result.follow_up_queries,
        "_reflection_number_of_ran_queries": len(state["search_query"]),
    }


def evaluate_radar_research(
    state: OverallState,
    config: RunnableConfig,
) -> str:
    """LangGraph routing function that determines next step in radar construction.

    Controls the research loop by deciding whether to continue gathering
    elements or finalize the radar. Includes smart stopping based on target achievement.

    Args:
        state: Current graph state containing reflection results
        config: Configuration for the runnable

    Returns:
        String indicating next node to visit
    """
    configurable = Configuration.from_runnable_config(config)
    max_research_loops = (
        state.get("max_research_loops")
        if state.get("max_research_loops") is not None
        else configurable.max_research_loops
    )
    
    # Get reflection data from state
    is_sufficient = state.get("_reflection_is_sufficient", False)
    research_loop_count = state.get("research_loop_count", 0)
    follow_up_queries = state.get("_reflection_follow_up_queries", [])
    number_of_ran_queries = state.get("_reflection_number_of_ran_queries", 0)
    current_count = state.get("_reflection_current_count", 0)
    target_count = state.get("target_element_count", 55)
    
    # Smart stopping logic based on target achievement
    target_achieved = current_count >= target_count
    target_nearly_achieved = current_count >= (target_count * 0.85)  # 85% of target
    target_significantly_exceeded = current_count >= (target_count * 1.5)  # 150% of target
    
    # Decision logic with target-based optimization
    should_stop = (
        is_sufficient or 
        research_loop_count >= max_research_loops or
        target_achieved or  # Stop if we reached the target
        target_significantly_exceeded  # Stop if we exceeded target by 50%
    )
    
    if should_stop:
        print(f"🎯 Stopping research: Elements={current_count}/{target_count}, Loops={research_loop_count}/{max_research_loops}")
        return "finalize_radar"
    else:
        # If we're close to target, reduce follow-up queries to avoid overshooting
        if target_nearly_achieved:
            # Limit to 1-2 queries when close to target
            follow_up_queries = follow_up_queries[:2]
            print(f"🎯 Near target ({current_count}/{target_count}), limiting to {len(follow_up_queries)} more queries")
        
        return [
            Send(
                "web_research",
                {
                    "search_query": follow_up_query,
                    "id": number_of_ran_queries + int(idx),
                },
            )
            for idx, follow_up_query in enumerate(follow_up_queries)
        ]


def get_quadrant_description(quadrant):
    """Helper function to get descriptions for quadrants"""
    descriptions = {
        "Techniques": "Methodologies, practices, and approaches for implementation",
        "Tools": "Specific software applications and utilities for direct use",
        "Platforms": "Infrastructure services and comprehensive environments",
        "Languages & Frameworks": "Programming languages and development frameworks"
    }
    return descriptions.get(quadrant, "Core technology component")


def get_ring_description(ring):
    """Helper function to get descriptions for rings"""
    descriptions = {
        "Adopt": "Production-ready, low-risk technologies recommended for broad use",
        "Trial": "Promising technologies worth pursuing in projects that can handle risk",
        "Assess": "Emerging technologies worth exploring to understand their potential",
        "Hold": "Technologies to proceed with caution or avoid due to limitations"
    }
    return descriptions.get(ring, "Technology requiring strategic evaluation")


def generate_better_url(tech_name: str) -> str:
    """Generate a better URL for a technology based on common patterns"""
    if not tech_name:
        return ""
    
    name_lower = tech_name.lower().replace(' ', '').replace('-', '').replace('_', '')
    
    # Common technology URL patterns
    url_patterns = {
        'tensorflow': 'https://tensorflow.org',
        'pytorch': 'https://pytorch.org',
        'keras': 'https://keras.io',
        'numpy': 'https://numpy.org',
        'pandas': 'https://pandas.pydata.org',
        'scikit-learn': 'https://scikit-learn.org',
        'docker': 'https://docker.com',
        'kubernetes': 'https://kubernetes.io',
        'react': 'https://reactjs.org',
        'vue': 'https://vuejs.org',
        'angular': 'https://angular.io',
        'nodejs': 'https://nodejs.org',
        'python': 'https://python.org',
        'java': 'https://oracle.com/java',
        'typescript': 'https://typescriptlang.org',
        'javascript': 'https://developer.mozilla.org/docs/Web/JavaScript',
        'mysql': 'https://mysql.com',
        'postgresql': 'https://postgresql.org',
        'mongodb': 'https://mongodb.com',
        'redis': 'https://redis.io',
        'elasticsearch': 'https://elastic.co',
        'apache': 'https://apache.org',
        'nginx': 'https://nginx.org',
        'aws': 'https://aws.amazon.com',
        'azure': 'https://azure.microsoft.com',
        'gcp': 'https://cloud.google.com',
        'langchain': 'https://github.com/langchain/langchain',
        'openai': 'https://openai.com',
        'huggingface': 'https://huggingface.co',
        'github': 'https://github.com',
        'gitlab': 'https://gitlab.com',
        'jupyter': 'https://jupyter.org',
        'streamlit': 'https://streamlit.io',
        'fastapi': 'https://fastapi.tiangolo.com',
        'django': 'https://djangoproject.com',
        'flask': 'https://flask.palletsprojects.com',
        'express': 'https://expressjs.com',
        'spring': 'https://spring.io',
        'rust': 'https://rust-lang.org',
        'go': 'https://golang.org',
        'kotlin': 'https://kotlinlang.org',
        'swift': 'https://swift.org',
        'flutter': 'https://flutter.dev',
        'reactnative': 'https://reactnative.dev',
        'xamarin': 'https://dotnet.microsoft.com/apps/xamarin',
        'unity': 'https://unity.com',
        'unreal': 'https://unrealengine.com',
        'blender': 'https://blender.org',
        'tensorflow.js': 'https://tensorflow.org/js',
        'pytorch.mobile': 'https://pytorch.org/mobile',
        'opencv': 'https://opencv.org',
        'spark': 'https://spark.apache.org',
        'hadoop': 'https://hadoop.apache.org',
        'kafka': 'https://kafka.apache.org',
        'airflow': 'https://airflow.apache.org',
        'dbt': 'https://getdbt.com',
        'snowflake': 'https://snowflake.com',
        'databricks': 'https://databricks.com',
        'tableau': 'https://tableau.com',
        'powerbi': 'https://powerbi.microsoft.com',
        'grafana': 'https://grafana.com',
        'prometheus': 'https://prometheus.io',
        'jenkins': 'https://jenkins.io',
        'gitlab ci': 'https://docs.gitlab.com/ee/ci',
        'github actions': 'https://github.com/features/actions',
        'terraform': 'https://terraform.io',
        'ansible': 'https://ansible.com',
        'puppet': 'https://puppet.com',
        'chef': 'https://chef.io'
    }
    
    # Try exact match first
    if name_lower in url_patterns:
        return url_patterns[name_lower]
    
    # Try partial matches
    for key, url in url_patterns.items():
        if key in name_lower or name_lower in key:
            return url
    
    # If no match found, return empty (will be filtered out)
    return ""


def finalize_radar(state: OverallState, config: RunnableConfig):
    """LangGraph node that creates the final radar output.

    Generates the comprehensive radar report and structured JSON dataset.

    Args:
        state: Current graph state containing all radar elements

    Returns:
        Dictionary with final radar output including JSON structure
    """
    from collections import defaultdict
    from datetime import datetime
    import json
    
    configurable = Configuration.from_runnable_config(config)
    reasoning_model_name = state.get("reasoning_model") or configurable.answer_model
    
    # Initialize the actual ChatGoogleGenerativeAI instance (following same pattern as other functions)
    reasoning_model = ChatGoogleGenerativeAI(
        model=reasoning_model_name,
        temperature=0.1,
        max_retries=2,
        api_key=get_api_key(config),
    )

    # Deduplicate radar elements
    existing_elements = state.get("radar_elements", [])
    unique_elements = {}
    for element in existing_elements:
        if hasattr(element, 'name'):
            key = element.name.lower()
            if key not in unique_elements:
                unique_elements[key] = element
        elif isinstance(element, dict):
            key = element['name'].lower()
            if key not in unique_elements:
                unique_elements[key] = element

    radar_elements_list = list(unique_elements.values())
    
    # Create statistics
    quadrant_counts = defaultdict(int)
    ring_counts = defaultdict(int)
    
    for element in radar_elements_list:
        if hasattr(element, 'quadrant'):
            quadrant_counts[element.quadrant] += 1
            ring_counts[element.ring] += 1
        elif isinstance(element, dict):
            quadrant_counts[element.get('quadrant', 'Unknown')] += 1
            ring_counts[element.get('ring', 'Unknown')] += 1

    # Generate enhanced summary report using AI
    current_date = get_current_date()
    radar_topic = state.get("radar_topic", "Technology Radar")
    
    # Calculate coverage metrics
    total_quadrants = len(quadrant_counts)
    total_rings = len(ring_counts)
    avg_score = sum([elem.score if hasattr(elem, 'score') else elem.get('score', 0) for elem in radar_elements_list]) / len(radar_elements_list) if radar_elements_list else 0
    
    # Find top elements by quadrant
    top_elements_by_quadrant = {}
    for quadrant in quadrant_counts.keys():
        quadrant_elements = [elem for elem in radar_elements_list 
                           if (hasattr(elem, 'quadrant') and elem.quadrant == quadrant) or 
                              (isinstance(elem, dict) and elem.get('quadrant') == quadrant)]
        if quadrant_elements:
            # Sort by score and take top 3
            sorted_elements = sorted(quadrant_elements, 
                                   key=lambda x: x.score if hasattr(x, 'score') else x.get('score', 0), 
                                   reverse=True)
            top_elements_by_quadrant[quadrant] = sorted_elements[:3]
    
    # Prepare research summaries for AI analysis
    research_summaries = []
    for element in radar_elements_list:
        if hasattr(element, 'name') and hasattr(element, 'description'):
            summary = f"{element.name}: {element.description}"
            if hasattr(element, 'rationale'):
                summary += f" - {element.rationale}"
            research_summaries.append(summary)
        elif isinstance(element, dict):
            summary = f"{element.get('name', 'Unknown')}: {element.get('description', 'No description')}"
            if element.get('rationale'):
                summary += f" - {element.get('rationale', '')}"
            research_summaries.append(summary)
    
    # Generate AI-powered strategic analysis using radar_finalization_instructions
    try:
        # Prepare research summaries for AI analysis
        research_summary_text = '\n'.join(research_summaries[:50])  # Limit to avoid token limits
        
        formatted_prompt = radar_finalization_instructions.format(
            radar_topic=radar_topic,
            summaries=research_summary_text,
            current_date=current_date
        )
        
        print(f"DEBUG: AI summary generation for {radar_topic}")
        print(f"DEBUG: Using model: {reasoning_model_name}")
        print(f"DEBUG: Prompt length: {len(formatted_prompt)} characters")
        
        # Use the reasoning model to generate strategic analysis
        ai_summary = reasoning_model.invoke(formatted_prompt)
        
        # Extract the content from the AI response
        if hasattr(ai_summary, 'content'):
            summary_report = ai_summary.content.strip()
        else:
            summary_report = str(ai_summary).strip()
            
        print(f"DEBUG: AI summary successful, length: {len(summary_report)}")
        
        # Basic validation - if too short, use fallback
        if len(summary_report) < 200:
            print(f"WARNING: AI summary too short ({len(summary_report)} chars), using fallback")
            raise ValueError("Summary too short")
            
    except Exception as e:
        print(f"ERROR: AI summary generation failed: {e}")
        print(f"DEBUG: Using fallback report")
        
        # Simple fallback
        top_tech_names = [elem.name if hasattr(elem, 'name') else elem.get('name', 'Unknown') 
                         for elem in radar_elements_list[:5]]
        
        summary_report = f"""{radar_topic} Technology Radar Analysis

THE CURRENT TOPIC LANDSCAPE
This analysis examined {len(radar_elements_list)} technologies in the {radar_topic.lower()} space. Key technologies identified include {', '.join(top_tech_names)} among others. The research reveals active development across multiple technology categories with varying levels of maturity and adoption.

NOTABLE PATTERNS AND SURPRISES
The technology distribution shows {ring_counts.get('Adopt', 0)} mature technologies ready for production use, {ring_counts.get('Trial', 0)} technologies worth piloting, and {ring_counts.get('Assess', 0)} emerging technologies to monitor. Organizations are balancing proven solutions with experimental approaches.

STRATEGIC IMPLICATIONS
Teams should prioritize proven technologies for critical systems while experimenting with promising new approaches. Focus on technologies with strong community support and clear adoption paths.

RESEARCH SCOPE
This analysis processed {len(radar_elements_list)} technologies through {state.get('research_loop_count', 0)} research iterations on {current_date}. AI analysis generation encountered issues."""

    # Create JSON structure for visualization
    radar_json = {
        "topic": radar_topic,
        "generated_date": datetime.now().strftime("%Y-%m-%d"),
        "generated_time": datetime.now().strftime("%H:%M:%S"),
        "total_elements": len(radar_elements_list),
        "summary_report": summary_report,
        "research_metadata": {
            "research_loops": state.get('research_loop_count', 0),
            "sources_analyzed": len(state.get('sources_gathered', [])),
            "target_elements": state.get('target_element_count', 55),
            "completion_rate": round(len(radar_elements_list)/state.get('target_element_count', 55)*100, 1),
            "average_score": round(avg_score, 1) if radar_elements_list else 0
        },
        "radar_data": [],
        "statistics": {
            "quadrants": dict(quadrant_counts),
            "rings": dict(ring_counts)
        }
    }
    
    # Convert elements to dictionary format with improved URLs
    for element in radar_elements_list:
        if hasattr(element, '__dict__'):
            element_dict = {
                "name": element.name,
                "description": element.description,
                "quadrant": element.quadrant,
                "ring": element.ring,
                "score": element.score,
                "rationale": element.rationale,
                "source_url": getattr(element, 'source_url', '')
            }
        else:
            element_dict = element
            # Ensure source_url is included for dict elements
            if 'source_url' not in element_dict:
                element_dict['source_url'] = ''
        
        # Improve source_url if empty or generic
        current_url = element_dict.get('source_url', '')
        bad_patterns = ['geeksforgeeks', 'wikipedia', 'github.com/github', 'vertexaisearch']
        
        if not current_url or any(bad in current_url.lower() for bad in bad_patterns):
            better_url = generate_better_url(element_dict.get('name', ''))
            if better_url:
                element_dict['source_url'] = better_url
            else:
                element_dict['source_url'] = ''
        
        radar_json["radar_data"].append(element_dict)

    # Save JSON to file (Python native, not AI-generated)
    import os
    output_dir = os.path.dirname(os.path.abspath(__file__))
    json_file_path = os.path.join(output_dir, "radar_output.json")
    
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(radar_json, f, indent=2, ensure_ascii=False)
        print(f"📄 Radar JSON saved to: {json_file_path}")
    except Exception as e:
        print(f"⚠️  Warning: Could not save JSON file: {e}")
        # Continue execution even if file save fails

    # Create final message with enhanced summary
    final_content = f"""{summary_report}

## 💾 Data Outputs
- **Detailed Report**: Above comprehensive analysis
- **JSON File**: `radar_output.json` (saved automatically)
- **Visualization Ready**: {len(radar_json['radar_data'])} elements structured for radar tools

## 🔗 Next Steps
1. **Review** the standout technologies in each quadrant
2. **Validate** adoption recommendations with your team context
3. **Visualize** using the generated JSON with radar visualization tools
4. **Update** the radar quarterly as technologies evolve

---
*Generated by AI-Powered Tech Radar Agent • {current_date} • {len(radar_elements_list)} Technologies Analyzed*
"""

    # Replace short URLs with original URLs in the summary
    unique_sources = []
    for source in state.get("sources_gathered", []):
        if source["short_url"] in final_content:
            final_content = final_content.replace(
                source["short_url"], source["value"]
            )
            unique_sources.append(source)

    return {
        "messages": [AIMessage(content=final_content)],
        "sources_gathered": unique_sources,
        "radar_elements": radar_elements_list,
        "radar_json": radar_json,  # Add the JSON structure directly to state
    }


# Create our Radar Agent Graph
builder = StateGraph(OverallState, config_schema=Configuration)

# Define the nodes
builder.add_node("generate_query", generate_query)
builder.add_node("web_research", web_research)
builder.add_node("extract_radar_elements", extract_radar_elements)
builder.add_node("radar_reflection", radar_reflection)
builder.add_node("finalize_radar", finalize_radar)

# Set the entrypoint
builder.add_edge(START, "generate_query")

# Add conditional edge to continue with search queries in parallel
builder.add_conditional_edges(
    "generate_query", continue_to_web_research, ["web_research"]
)

# Extract radar elements from web research
builder.add_edge("web_research", "extract_radar_elements")

# Reflect on radar completeness
builder.add_edge("extract_radar_elements", "radar_reflection")

# Evaluate whether to continue research or finalize
builder.add_conditional_edges(
    "radar_reflection", evaluate_radar_research, ["web_research", "finalize_radar"]
)

# Finalize the radar
builder.add_edge("finalize_radar", END)

graph = builder.compile(name="tech-radar-agent")
