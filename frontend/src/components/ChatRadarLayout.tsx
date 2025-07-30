import React, { useState, useEffect } from 'react';
import { Message } from "@langchain/langgraph-sdk";
import { ChatMessagesView } from './ChatMessagesView';
import { RadarVisualization } from './RadarVisualization';
import { ProcessedEvent } from './ActivityTimeline';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';

interface RadarData {
  topic: string;
  generated_date: string;
  total_elements: number;
  radar_data: Array<{
    name: string;
    description: string;
    quadrant: string;
    ring: string;
    score: number;
    rationale: string;
  }>;
  statistics: {
    quadrants: Record<string, number>;
    rings: Record<string, number>;
  };
}

interface ChatRadarLayoutProps {
  messages: Message[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (inputValue: string, effort: string) => void;
  onCancel: () => void;
  liveActivityEvents: ProcessedEvent[];
  historicalActivities: Record<string, ProcessedEvent[]>;
}

export const ChatRadarLayout: React.FC<ChatRadarLayoutProps> = ({
  messages,
  isLoading,
  scrollAreaRef,
  onSubmit,
  onCancel,
  liveActivityEvents,
  historicalActivities,
}) => {
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [radarVisible, setRadarVisible] = useState(false);
  const [radarExpanded, setRadarExpanded] = useState(false);

  // Extract radar data from messages or events
  useEffect(() => {
    // Try to get radar data from the streaming events first
    if (liveActivityEvents.length > 0) {
      // Check if there's any event with radar data
      const radarEvent = liveActivityEvents.find(event => 
        event.title === "Finalizing Tech Radar"
      );
      
      if (radarEvent && !radarData) {
        // The radar data should come from the backend state
        // For now, we'll extract it from the AI message
        setRadarVisible(true);
      }
    }

    // Look for radar data in the latest AI message
    const latestAiMessage = messages
      .filter(msg => msg.type === 'ai')
      .slice(-1)[0];

    if (latestAiMessage?.content) {
      try {
        // Convert content to string if it's not already
        const contentStr = typeof latestAiMessage.content === 'string' 
          ? latestAiMessage.content 
          : JSON.stringify(latestAiMessage.content);
          
        // Try to extract JSON from the message content
        const jsonMatch = contentStr.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[1]);
          if (parsedData.radar_data && Array.isArray(parsedData.radar_data)) {
            setRadarData(parsedData);
            setRadarVisible(true);
          }
        }
      } catch (error) {
        console.log('Could not parse radar data from message:', error);
      }
    }
  }, [messages, liveActivityEvents]);

  // Auto-show radar when construction is complete
  useEffect(() => {
    if (!isLoading && radarData && messages.length > 0) {
      const lastEvent = liveActivityEvents[liveActivityEvents.length - 1];
      if (lastEvent?.title === "Finalizing Tech Radar") {
        setRadarVisible(true);
      }
    }
  }, [isLoading, radarData, messages, liveActivityEvents]);

  const toggleRadar = () => {
    setRadarVisible(!radarVisible);
  };

  const toggleRadarExpanded = () => {
    setRadarExpanded(!radarExpanded);
  };

  return (
    <div className="flex h-full">
      {/* Chat Panel */}
      <div className={`flex-1 transition-all duration-300 ${
        radarVisible ? (radarExpanded ? 'w-1/3' : 'w-1/2') : 'w-full'
      }`}>
        <div className="relative h-full">
          <ChatMessagesView
            messages={messages}
            isLoading={isLoading}
            scrollAreaRef={scrollAreaRef}
            onSubmit={onSubmit}
            onCancel={onCancel}
            liveActivityEvents={liveActivityEvents}
            historicalActivities={historicalActivities}
          />
          
          {/* Radar Toggle Button */}
          {radarData && (
            <Button
              onClick={toggleRadar}
              className={`absolute top-4 right-4 z-10 bg-purple-600 hover:bg-purple-700 text-white ${
                radarVisible ? 'bg-purple-700' : ''
              }`}
              size="sm"
            >
              {radarVisible ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {radarVisible ? 'Hide' : 'Show'} Radar
            </Button>
          )}
        </div>
      </div>

      {/* Radar Panel */}
      {radarVisible && (
        <div className={`transition-all duration-300 border-l border-neutral-700 ${
          radarExpanded ? 'w-2/3' : 'w-1/2'
        }`}>
          <div className="relative h-full">
            {/* Radar Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                onClick={toggleRadarExpanded}
                className="bg-neutral-700 hover:bg-neutral-600 text-white"
                size="sm"
              >
                {radarExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
                {radarExpanded ? 'Minimize' : 'Expand'}
              </Button>
              <Button
                onClick={toggleRadar}
                className="bg-neutral-700 hover:bg-neutral-600 text-white"
                size="sm"
              >
                <ChevronRight size={16} />
                Close
              </Button>
            </div>

            <RadarVisualization 
              data={radarData} 
              isVisible={radarVisible}
            />
          </div>
        </div>
      )}
    </div>
  );
};
