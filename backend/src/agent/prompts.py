from datetime import datetime


# Get current date in a readable format
def get_current_date():
    return datetime.now().strftime("%B %d, %Y")


query_writer_instructions = """Generate {number_queries} focused search queries for "{research_topic}" technology radar.

Find tools, techniques, platforms, frameworks. Current date: {current_date}.

JSON format:
```json
{{
    "rationale": "Brief reason",
    "query": ["query1", "query2", "query3"]
}}
```

Topic: {research_topic}"""


web_searcher_instructions = """Research technologies for "{research_topic}" radar. Current date: {current_date}.

Find specific technologies with names, descriptions, maturity level, and source URLs.
Focus on actionable technologies, not concepts. Be concise.
Focus on github stars. 
Avoid biases towards popular or well-known technologies.
Include diverse sources: blogs, articles, papers, repositories.
Include well known technologies, but also emerging ones.
Do not give preference to any specific technology or company.
Care about open source projects, give them priority.
Give more weight to technologies from no big tech companies.
Extensive github repositories research is good, MIT license projects are preferred.
Privacy as desing is a plus.
Comunity-driven projects are a plus.
Social good is a plus.
Open gobernance is a plus.
Include AI technologies basics, as python, matplotlib, pandas, numpy, etc.
Do not miss 

Research Topic: {research_topic}"""


radar_element_extraction_instructions = """Extract {extraction_limit} technologies from research for "{radar_topic}". Current: {current_count}/{target_count}.

QUADRANTS: Techniques, Tools, Platforms, Languages & Frameworks
RINGS: Adopt (proven), Trial (promising), Assess (exploring), Hold (caution)x
SCORES: 1-3 (experimental), 4-6 (emerging), 7-8 (established), 9-10 (standard)

Extract unique technologies with name, description, quadrant, ring, score, rationale, source_url.
Use real URLs from research. Balance across quadrants. Avoid duplicates.

IMPORTANT: Each technology MUST include a valid source_url field with a real web URL

Current date: {current_date}
Research: {summaries}"""


radar_reflection_instructions = """Analyze radar for "{radar_topic}". Current: {current_count}/{target_count} ({progress_percentage}%).

STOP if: current_count >= target_count OR >= 90% of target
CONTINUE only if significantly below target with clear gaps

Output JSON:
```json
{{
    "is_sufficient": true/false,
    "current_count": {current_count},
    "knowledge_gap": "missing areas",
    "follow_up_queries": ["query1", "query2"]
}}
```

Elements: {elements_summary}"""


radar_finalization_instructions = """Generate final radar for "{radar_topic}" with summary and complete data.

Include:
1. Brief research overview and key findings
2. Complete radar elements with proper classification
3. Statistics: counts per quadrant/ring

Current date: {current_date}
Research: {summaries}

Target: Well-classified radar elements."""
