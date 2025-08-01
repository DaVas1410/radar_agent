import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProcessedEvent } from "@/components/ActivityTimeline";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Button } from "@/components/ui/button";
// import { sampleRadarData } from "@/radar/sample-radar-data"; // For testing

export default function App() {
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<
    ProcessedEvent[]
  >([]);
  const [radarData, setRadarData] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasFinalizeEventOccurredRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  
  const thread = useStream<{
    messages: Message[];
    initial_search_query_count: number;
    max_research_loops: number;
    target_element_count: number;
    reasoning_model: string;
    radar_json?: any;
  }>({
    apiUrl: import.meta.env.DEV
      ? "http://localhost:2024"
      : "http://localhost:8123",
    assistantId: "agent",
    messagesKey: "messages",
    onUpdateEvent: (event: any) => {
      let processedEvent: ProcessedEvent | null = null;
      
      // Extract radar data if available
      if (event.radar_json || (event.finalize_radar && event.finalize_radar.radar_json)) {
        const radarJson = event.radar_json || event.finalize_radar.radar_json;
        console.log('Radar data received:', radarJson);
        setRadarData(radarJson);
      }
      
      if (event.generate_query) {
        processedEvent = {
          title: "Generating Tech Radar Queries",
          data: event.generate_query?.search_query?.join(", ") || "",
        };
      } else if (event.web_research) {
        const sources = event.web_research.sources_gathered || [];
        const numSources = sources.length;
        const uniqueLabels = [
          ...new Set(sources.map((s: any) => s.label).filter(Boolean)),
        ];
        const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
        processedEvent = {
          title: "Researching Technologies",
          data: `Gathered ${numSources} sources. Related to: ${
            exampleLabels || "N/A"
          }.`,
        };
      } else if (event.extract_radar_elements) {
        const elementsCount = event.extract_radar_elements?.total_found || 0;
        processedEvent = {
          title: "Extracting Radar Elements",
          data: `Identified ${elementsCount} technology elements for radar placement.`,
        };
      } else if (event.radar_reflection) {
        const currentCount = event.radar_reflection?.current_count || 0;
        const targetCount = 25; // Default target, will be overridden by actual value
        processedEvent = {
          title: "Analyzing Radar Completeness",
          data: `Found ${currentCount}/${targetCount} elements. Evaluating coverage gaps.`,
        };
      } else if (event.finalize_radar) {
        processedEvent = {
          title: "Finalizing Tech Radar",
          data: "Generating comprehensive radar report and structured dataset.",
        };
        hasFinalizeEventOccurredRef.current = true;
      }
      if (processedEvent) {
        setProcessedEventsTimeline((prevEvents) => [
          ...prevEvents,
          processedEvent!,
        ]);
      }
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [thread.messages]);

  const handleSubmit = useCallback(
    (submittedInputValue: string, effort: string, model = "gemini-2.5-flash") => {
      if (!submittedInputValue.trim()) return;
      setProcessedEventsTimeline([]);
      setRadarData(null); // Reset radar data for new search
      hasFinalizeEventOccurredRef.current = false;

      // Convert effort to initial_search_query_count and max_research_loops for radar construction
      // 🚀 OPTIMIZED FOR SPEED - Reduced parameters for faster execution
      // low means ultra fast radar with minimal elements (1 loop, 2 queries, 15 elements) ~1-2 minutes
      // medium means fast radar construction (2 loops, 3 queries, 25 elements) ~2-4 minutes  
      // high means balanced radar with good depth (3 loops, 3 queries, 35 elements) ~4-7 minutes
      let initial_search_query_count = 0;
      let max_research_loops = 0;
      let target_element_count = 0;
      switch (effort) {
        case "low":    // 🚀 ULTRA FAST (1-2 minutes)
          initial_search_query_count = 2;
          max_research_loops = 1;
          target_element_count = 15;
          break;
        case "medium": // ⚡ FAST (2-4 minutes)
          initial_search_query_count = 3;
          max_research_loops = 2;
          target_element_count = 25;
          break;
        case "high":   // 🎯 BALANCED (4-7 minutes)
          initial_search_query_count = 3;
          max_research_loops = 3;
          target_element_count = 35;
          break;
      }

      const newMessages: Message[] = [
        ...(thread.messages || []),
        {
          type: "human",
          content: submittedInputValue,
          id: Date.now().toString(),
        },
      ];
      thread.submit({
        messages: newMessages,
        initial_search_query_count: initial_search_query_count,
        max_research_loops: max_research_loops,
        target_element_count: target_element_count,
        reasoning_model: model,
      });
    },
    [thread]
  );

  const handleCancel = useCallback(() => {
    thread.stop();
    window.location.reload();
  }, [thread]);

  return (
    <div className="flex h-screen bg-neutral-800 text-neutral-100 font-sans antialiased">
      <main className="h-full w-full mx-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl text-red-400 font-bold">Error</h1>
                <p className="text-red-400">{JSON.stringify(error)}</p>

                <Button
                  variant="destructive"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <WelcomeScreen
              handleSubmit={handleSubmit}
              isLoading={thread.isLoading}
              onCancel={handleCancel}
              radarData={radarData}
              activityEvents={processedEventsTimeline}
            />
          )}
      </main>
    </div>
  );
}
