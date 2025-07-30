from __future__ import annotations

from dataclasses import dataclass, field
from typing_extensions import TypedDict, Annotated

from langgraph.graph import add_messages


import operator


class OverallState(TypedDict):
    messages: Annotated[list, add_messages]
    search_query: Annotated[list, operator.add]
    web_research_result: Annotated[list, operator.add]
    sources_gathered: Annotated[list, operator.add]
    initial_search_query_count: int
    max_research_loops: int
    research_loop_count: int
    reasoning_model: str
    # Radar-specific fields
    radar_elements: list  # Current radar elements (replaced, not accumulated)
    radar_topic: str  # The main topic for radar construction
    target_element_count: int  # Target number of elements (50-60)
    radar_json: dict  # Final JSON structure for visualization
    # Reflection state fields (used internally)
    _reflection_is_sufficient: bool
    _reflection_current_count: int
    _reflection_knowledge_gap: str
    _reflection_follow_up_queries: Annotated[list, operator.add]
    _reflection_number_of_ran_queries: int


class ReflectionState(TypedDict):
    is_sufficient: bool
    knowledge_gap: str
    follow_up_queries: Annotated[list, operator.add]
    research_loop_count: int
    number_of_ran_queries: int


class RadarReflectionState(TypedDict):
    is_sufficient: bool
    current_count: int
    knowledge_gap: str
    follow_up_queries: Annotated[list, operator.add]
    research_loop_count: int
    number_of_ran_queries: int


class Query(TypedDict):
    query: str
    rationale: str


class QueryGenerationState(TypedDict):
    search_query: list[str]
    radar_topic: str
    target_element_count: int
    radar_elements: list


class WebSearchState(TypedDict):
    search_query: str
    id: str


class RadarElementsState(TypedDict):
    radar_elements: list
    total_found: int


@dataclass(kw_only=True)
class SearchStateOutput:
    running_summary: str = field(default=None)  # Final report
