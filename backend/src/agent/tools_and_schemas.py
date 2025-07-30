from typing import List, Literal
from pydantic import BaseModel, Field


class SearchQueryList(BaseModel):
    query: List[str] = Field(
        description="A list of search queries to be used for web research."
    )
    rationale: str = Field(
        description="A brief explanation of why these queries are relevant to the research topic."
    )


class Reflection(BaseModel):
    is_sufficient: bool = Field(
        description="Whether the provided summaries are sufficient to answer the user's question."
    )
    knowledge_gap: str = Field(
        description="A description of what information is missing or needs clarification."
    )
    follow_up_queries: List[str] = Field(
        description="A list of follow-up queries to address the knowledge gap."
    )


class RadarElement(BaseModel):
    name: str = Field(description="Name of the technology, tool, technique, or platform")
    description: str = Field(description="Brief description of what this element is")
    quadrant: Literal["Techniques", "Tools", "Platforms", "Languages & Frameworks"] = Field(
        description="Which quadrant this element belongs to"
    )
    ring: Literal["Adopt", "Trial", "Assess", "Hold"] = Field(
        description="Which ring this element belongs to"
    )
    score: int = Field(
        description="Relevance/maturity score from 1-10",
        ge=1,
        le=10
    )
    rationale: str = Field(
        description="Explanation for the quadrant, ring, and score assignment"
    )
    source_url: str = Field(
        description="Primary source URL where information about this technology was found",
        default=""
    )


class RadarElementsList(BaseModel):
    elements: List[RadarElement] = Field(
        description="List of radar elements extracted from research"
    )
    total_found: int = Field(
        description="Total number of elements found in this research iteration"
    )


class RadarReflection(BaseModel):
    is_sufficient: bool = Field(
        description="Whether we have enough elements (50-60) for a comprehensive radar"
    )
    current_count: int = Field(
        description="Current number of unique elements found"
    )
    knowledge_gap: str = Field(
        description="What areas need more research to reach 50-60 elements"
    )
    follow_up_queries: List[str] = Field(
        description="Specific queries to find more elements in underrepresented areas"
    )


class RadarOutput(BaseModel):
    summary_report: str = Field(
        description="Brief report summarizing the research process and key findings"
    )
    radar_data: List[RadarElement] = Field(
        description="Complete list of radar elements for visualization"
    )
    topic: str = Field(
        description="The radar topic"
    )
    generated_date: str = Field(
        description="Date when the radar was generated"
    )
    total_elements: int = Field(
        description="Total number of elements in the radar"
    )


class RadarJsonOutput(BaseModel):
    """Final JSON output structure for radar visualization"""
    topic: str = Field(description="The radar topic")
    generated_date: str = Field(description="Generation date")
    total_elements: int = Field(description="Total number of elements")
    radar_data: List[dict] = Field(description="List of radar elements as dictionaries")
    statistics: dict = Field(description="Statistics about quadrants and rings")
