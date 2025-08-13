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
Focus on python and python librearies for the {research_topic} radar.

CRITICAL: RESEARCH "HOLD" TECHNOLOGIES (10% of results):
Research technologies with caution flags for the Hold ring:
- Deprecated or legacy technologies still in use
- Technologies with known security vulnerabilities  
- Vendor-locked proprietary solutions with limitations
- Technologies being phased out or replaced
- Tools with poor maintenance or community abandonment
- Technologies with licensing or compliance issues
- Over-hyped technologies that failed to deliver
- Technologies with performance or scalability problems

Examples of Hold research queries:
- "deprecated {research_topic} tools security issues"
- "legacy {research_topic} technologies problems limitations" 
- "{research_topic} vendor lock-in proprietary issues"
- "abandoned {research_topic} projects maintenance problems"
- "{research_topic} technologies to avoid security vulnerabilities"

Research Topic: {research_topic}"""


radar_element_extraction_instructions = """Extract {extraction_limit} technologies from research for "{radar_topic}". Current: {current_count}/{target_count}.

QUADRANTS: Techniques, Tools, Platforms, Languages & Frameworks
RINGS: Adopt (proven), Trial (promising), Assess (exploring), Hold (caution)
SCORES: 1-3 (experimental), 4-6 (emerging), 7-8 (established), 9-10 (standard)

BALANCED DISTRIBUTION STRATEGY:
RING DISTRIBUTION (Equal Balance):
- Hold: 10% - Technologies with caution flags (deprecated, security issues, vendor lock-in)
- Adopt: 30% - Proven, production-ready technologies
- Trial: 35% - Promising technologies worth piloting
- Assess: 25% - Technologies worth exploring/monitoring

MANDATORY HOLD TECHNOLOGIES (10% of extraction):
ACTIVELY IDENTIFY technologies that belong in Hold ring:
- Deprecated/legacy technologies still widely used but problematic
- Technologies with known security vulnerabilities or poor security practices
- Vendor-locked proprietary solutions with significant limitations
- Technologies being officially phased out or reaching end-of-life
- Abandoned or poorly maintained projects with security/stability risks
- Technologies with licensing issues or compliance problems
- Over-hyped technologies that failed to deliver on promises
- Technologies with fundamental design flaws or scalability issues
- Tools that have better modern alternatives available

HOLD EXAMPLES BY QUADRANT:
- Techniques: Outdated methodologies, deprecated practices, harmful patterns
- Tools: Legacy software, deprecated tools, security-problematic applications
- Platforms: End-of-life systems, vendor-locked platforms, insecure infrastructure
- Languages & Frameworks: Deprecated versions, unmaintained frameworks, problematic libraries

QUADRANT DISTRIBUTION (Equal Balance):
- Techniques: 25% - Methodologies, practices, approaches
- Tools: 25% - Software tools, applications, utilities
- Platforms: 25% - Infrastructure, systems, environments  
- Languages & Frameworks: 25% - Programming languages, development frameworks

MATURITY SCORE DISTRIBUTION (Equal Balance):
- Experimental (1-3): 25% - Early stage, proof of concept
- Emerging (4-6): 25% - Growing adoption, still evolving
- Established (7-8): 25% - Mature, widely adopted
- Standard (9-10): 25% - Industry standard, ubiquitous

ENSURE EQUAL REPRESENTATION:
- Avoid clustering all technologies in single categories
- Actively seek diverse maturity levels within each quadrant
- Balance new/experimental with established technologies
- Include both niche and mainstream solutions
- PRIORITIZE finding Hold technologies if missing from current set

Extract unique technologies with name, description, quadrant, ring, score, rationale, source_url.
Use real URLs from research. ENFORCE balanced distribution across ALL dimensions.
Avoid duplicates. Monitor distribution ratios continuously.

CRITICAL URL REQUIREMENTS:
- Each technology MUST have a specific, working source_url
- Use official project websites (e.g., https://tensorflow.org, https://pytorch.org)
- Use official GitHub repositories (e.g., https://github.com/langchain/langchain)
- Use official documentation sites (e.g., https://docs.docker.com)
- NEVER use generic sites like geeksforgeeks.org, wikipedia.org, or search placeholders
- NEVER use invalid URLs like "https://github.com/github.com"
- Each URL should be the PRIMARY authoritative source for that technology

Current date: {current_date}
Research: {summaries}"""


radar_reflection_instructions = """Analyze radar for "{radar_topic}". Current: {current_count}/{target_count} ({progress_percentage}%).

STOP if: current_count >= target_count OR >= 90% of target
CONTINUE only if significantly below target with clear gaps

BALANCED DISTRIBUTION CHECK:
VERIFY EQUAL DISTRIBUTION ACROSS:
- Rings: Hold(10%), Adopt(30%), Trial(35%), Assess(25%)
- Quadrants: Each should have ~25% of total technologies
- Maturity: Each score range (1-3, 4-6, 7-8, 9-10) should have ~25%
- Technology Types: Balance between new/experimental vs established/standard

FLAG IMBALANCES:
- Too many technologies clustered in single quadrant
- Missing representation in Hold ring
- Skewed toward only high/low maturity scores
- Over-representation of popular/mainstream technologies

CRITICAL HOLD RING CHECK:
If Hold ring is MISSING or UNDERREPRESENTED (< 8% of total):
- MANDATORY CONTINUE research with specific Hold-focused queries
- Generate queries specifically targeting problematic/deprecated technologies
- Examples: "deprecated {radar_topic} security vulnerabilities", "legacy {radar_topic} problems", "{radar_topic} vendor lock-in issues"
- Do not stop until Hold ring has adequate representation

REQUIRED FOLLOW-UP QUERIES FOR MISSING HOLD:
- "deprecated {radar_topic} technologies security issues"
- "legacy {radar_topic} systems problems limitations"
- "{radar_topic} vendor lock-in proprietary concerns"
- "abandoned {radar_topic} projects maintenance issues"
- "{radar_topic} technologies end of life deprecated"

Output JSON:
```json
{{
    "is_sufficient": true/false,
    "current_count": {current_count},
    "knowledge_gap": "missing areas, ring imbalances, or quadrant clustering",
    "distribution_analysis": "assessment of current balance across dimensions",
    "follow_up_queries": ["query1", "query2"]
}}
```

Elements: {elements_summary}"""


radar_finalization_instructions= """Create a comprehensive strategic analysis of the {radar_topic} technology landscape. This is for a PDF report, so use clean formatting with headers and organized sections.

Write like a senior technology analyst providing strategic intelligence to leadership. Be insightful, specific, and substantive - minimum 1000 words.

# {radar_topic} Technology Radar Analysis

## Executive Summary
Provide a 1-3 paragraph overview of the current {radar_topic} landscape. What's the maturity level? What are the key trends driving adoption? What should leaders know about this space right now?

## Market Dynamics and Key Trends
Analyze what you discovered in your research. Write 3-4 substantial paragraphs covering:
- Which technology categories are seeing the most innovation?
- What's driving enterprise adoption decisions?
- Are there notable gaps between hype and practical adoption?
- Which vendors or open source projects are leading?

## Technology Landscape Analysis
Break down your findings by quadrant. For each major category, discuss:
- What types of technologies dominate?
- Which ones represent safe bets vs. emerging opportunities?
- Any notable absences or surprising inclusions?

Use this structure:
**Tools & Platforms:** [Analysis paragraph]
**Languages & Frameworks:** [Analysis paragraph]  
**Techniques & Methodologies:** [Analysis paragraph]

## Strategic Recommendations
Write 2-4 paragraphs addressing:
- Where should organizations focus their immediate investments?
- Which technologies offer competitive advantages?
- What capabilities are becoming table stakes?
- How should teams approach the "Assess" and "Trial" technologies?

## Implementation Considerations  
Discuss practical aspects:
- Common adoption challenges in this space
- Resource and skill requirements
- Integration complexity
- Risk factors to consider

## Research Methodology and Scope
Detail your analysis approach:
- Number of sources analyzed and research depth
- Technology coverage and selection criteria
- Quality assessment approach
- Any limitations or biases in the analysis


REQUIREMENTS:
- Minimum 500 words
- Use specific examples and concrete observations
- Reference actual technologies by name when making points
- Provide actionable insights, not just descriptions
- Use clean formatting appropriate for PDF
- Research date: {current_date}

Research findings: {summaries}"""