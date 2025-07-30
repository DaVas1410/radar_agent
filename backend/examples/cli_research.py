import argparse
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from langchain_core.messages import HumanMessage
from agent.graph import graph


def main() -> None:
    """Run the tech radar agent from the command line."""
    parser = argparse.ArgumentParser(description="Run the LangGraph tech radar agent")
    parser.add_argument("topic", help="Tech radar topic (e.g., 'Data Visualization Radar')")
    parser.add_argument(
        "--initial-queries",
        type=int,
        default=4,
        help="Number of initial search queries for radar construction",
    )
    parser.add_argument(
        "--max-loops",
        type=int,
        default=4,
        help="Maximum number of research loops to find 50-60 elements",
    )
    parser.add_argument(
        "--reasoning-model",
        default="gemini-2.5-pro",
        help="Model for the final radar output",
    )
    args = parser.parse_args()

    print(f"🔍 Building tech radar for: {args.topic}")
    print(f"📊 Target: 50-60 technology elements")
    print(f"🔄 Max research loops: {args.max_loops}")
    print("⚡ Starting radar construction...\n")

    state = {
        "messages": [HumanMessage(content=args.topic)],
        "initial_search_query_count": args.initial_queries,
        "max_research_loops": args.max_loops,
        "reasoning_model": args.reasoning_model,
        "radar_topic": args.topic,
        "target_element_count": 55,
        "radar_elements": [],
    }

    result = graph.invoke(state)
    messages = result.get("messages", [])
    if messages:
        print("🎯 Tech Radar Construction Complete!")
        print("=" * 50)
        print(messages[-1].content)
        print("=" * 50)
        
        # Print some stats
        radar_elements = result.get("radar_elements", [])
        if radar_elements:
            print(f"\n📈 Total elements found: {len(radar_elements)}")


if __name__ == "__main__":
    main()
