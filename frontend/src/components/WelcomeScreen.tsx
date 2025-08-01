import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Brain, StopCircle, ArrowRight } from "lucide-react";
import { TechRadarV8 } from "../radar/radar V8";
import { TechCategoryChart } from "./TechCategoryChart";
import { AdoptionLevelsChart } from "./AdoptionLevelsChart";
import { SummarySection } from "./SummarySection";

interface WelcomeScreenProps {
  handleSubmit: (
    submittedInputValue: string,
    effort: string
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
  radarData?: any;
  activityEvents?: any[];
}

const PREDEFINED_THEMES = [
  {
    title: "AI & Machine Learning",
    description: "Latest frameworks, tools, and platforms for AI/ML development",
    topics: "TensorFlow, PyTorch, Hugging Face, OpenAI APIs, LangChain, MLOps"
  },
  {
    title: "Frontend Development",
    description: "Modern frontend technologies, frameworks, and tooling",
    topics: "React, Vue, Svelte, Next.js, TypeScript, Tailwind CSS"
  },
  {
    title: "Cloud Native & DevOps",
    description: "Container orchestration, CI/CD, and cloud infrastructure tools",
    topics: "Kubernetes, Docker, Terraform, AWS, Azure, GitHub Actions"
  },
  {
    title: "Data Engineering",
    description: "Big data processing, streaming, and analytics platforms",
    topics: "Apache Kafka, Spark, Airflow, dbt, Snowflake, Databricks"
  },
  {
    title: "Backend Development",
    description: "Server-side frameworks, databases, and API technologies",
    topics: "Node.js, Python FastAPI, PostgreSQL, GraphQL, microservices"
  },
  {
    title: "Mobile Development",
    description: "Cross-platform and native mobile development technologies",
    topics: "React Native, Flutter, Swift, Kotlin, Expo, mobile testing"
  },
  {
    title: "Cybersecurity",
    description: "Security tools, practices, and frameworks for modern applications",
    topics: "Zero trust, SAST/DAST, container security, identity management"
  },
  {
    title: "JavaScript Ecosystem",
    description: "JavaScript runtime, frameworks, and development tools",
    topics: "Node.js, Deno, Bun, testing frameworks, bundlers, package managers"
  }
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
  radarData,
  activityEvents = [],
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [effort, setEffort] = useState("medium");
  const [logoHovered, setLogoHovered] = useState(false);
  const agentStepsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new activity events are added
  useEffect(() => {
    if (agentStepsRef.current && activityEvents.length > 0) {
      agentStepsRef.current.scrollTop = agentStepsRef.current.scrollHeight;
    }
  }, [activityEvents]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const topic = selectedTheme || inputValue;
    if (!topic.trim()) return;
    
    // If a predefined theme is selected, use optimized settings
    if (selectedTheme) {
      // For predefined themes: use low effort (which should be faster/fewer elements)
      handleSubmit(topic, "low");
    } else {
      // For custom input: use selected effort level
      handleSubmit(topic, effort);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const handleThemeSelect = (themeName: string) => {
    setSelectedTheme(themeName);
    setInputValue(""); // Clear custom input when selecting a theme
  };

  const isSubmitDisabled = (!selectedTheme && !inputValue.trim()) || isLoading;

  return (
    <>
      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-[100rem] mx-auto px-10 py-4 flex items-center justify-between">
          {/* Left side - Title only */}
          <div className="text-neutral-100 text-lg font-semibold">
            Tech Radar Builder
          </div>
          
          {/* Right side - Logo */}
          <div className="flex items-center gap-4">
            <a 
              href="https://diversa.studio/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              onClick={() => setLogoHovered(!logoHovered)}
            >
              <img 
                src={logoHovered ? "./Artboard 2 copy 3.png" : "./Artboard 2 copy 4.png"}
                alt="Diversa Studio"
                className="h-8 w-auto transition-all duration-300 ease-in-out"
                onLoad={() => console.log("Logo loaded successfully")}
                onError={(e) => {
                  console.log("Logo failed to load:", e.currentTarget.src);
                  console.log("Trying alternative paths...");
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src.includes('./')) {
                    target.src = logoHovered ? "/Artboard 2 copy 3.png" : "/Artboard 2 copy 4.png";
                  } else if (target.src.includes('/Artboard')) {
                    target.src = logoHovered ? "Artboard 2 copy 3.png" : "Artboard 2 copy 4.png";
                  } else {
                    target.style.display = 'none';
                    const parent = target.parentElement!;
                    parent.innerHTML = '<div class="bg-blue-600 text-white px-2 py-1 rounded font-bold text-xs hover:bg-blue-700 transition-colors">Diversa</div>';
                  }
                }}
              />
            </a>
          </div>
        </div>
      </div>

      {/* Combined Instructions, Configuration, Radar, and Agent History section below header */}
      <div className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-700 overflow-y-auto">
        <div className="max-w-[100rem] mx-auto px-10 py-4">
          {/* Instructions */}
          <div className="text-left space-y-4 mb-8">
            <p className="text-base text-neutral-200 leading-relaxed">
              Welcome to the <strong>Tech Radar Builder</strong> – an AI-powered platform that creates comprehensive technology landscapes 
              for any domain. Our intelligent agents research and analyze emerging technologies in real-time, organizing them into 
              interactive visualizations that help you understand the current state and future trends of your chosen field.
            </p>
            <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
                📋 How to Use This Platform
              </h3>
              <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <div>
                  <strong>1. Choose Your Domain:</strong> Select from popular technology domains in the dropdown, or describe your own custom area of interest in the text field.
                </div>
                <div>
                  <strong>2. Set Research Depth:</strong> Choose how comprehensive you want the analysis:
                  <ul className="ml-4 mt-1 space-y-1 text-xs">
                    <li>• <strong>Quick:</strong> Ultra-fast analysis with ~15 technologies (1-2 minutes)</li>
                    <li>• <strong>Balanced:</strong> Fast analysis with ~25 technologies (2-4 minutes)</li>
                    <li>• <strong>Thorough:</strong> Comprehensive analysis with ~35 technologies (4-7 minutes)</li>
                  </ul>
                </div>
                <div>
                  <strong>3. Generate & Explore:</strong> Click "Start Building Radar" and watch our AI agents research, analyze, and organize technologies into adoption levels (Adopt, Trial, Assess, Hold) and categories (Techniques, Tools, Platforms, Languages & Frameworks).
                </div>
                <div>
                  <strong>4. Interactive Analysis:</strong> Use the radar to explore technologies by clicking on dots for detailed information, filtering by categories or adoption levels, and accessing source links for further research.
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleFormSubmit} className="mb-8">
            {/* Horizontal Configuration Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-end">
              {/* Popular Domains Dropdown */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Popular Tech Domains
                  <span className="text-xs text-neutral-500 block">(Pre-configured domains for quick start)</span>
                </label>
                <Select value={selectedTheme} onValueChange={handleThemeSelect}>
                  <SelectTrigger className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 h-10">
                    <SelectValue placeholder="Choose a popular domain..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-700 border-neutral-600">
                    {PREDEFINED_THEMES.map((theme, index) => (
                      <SelectItem 
                        key={index} 
                        value={theme.title}
                        className="text-neutral-100 hover:bg-neutral-600 focus:bg-neutral-600"
                      >
                        <span className="font-medium">{theme.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Research Effort */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-neutral-400" />
                    <span>Research Effort</span>
                  </div>
                </label>
                <Select value={effort} onValueChange={setEffort}>
                  <SelectTrigger className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-700 border-neutral-600">
                    <SelectItem value="low" className="text-neutral-100 hover:bg-neutral-600">
                      Quick
                    </SelectItem>
                    <SelectItem value="medium" className="text-neutral-100 hover:bg-neutral-600">
                      Balanced
                    </SelectItem>
                    <SelectItem value="high" className="text-neutral-100 hover:bg-neutral-600">
                      Thorough
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Input - Made longer */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Custom Topic
                  <span className="text-xs text-neutral-500 block">(Alternative to dropdown)</span>
                </label>
                <Textarea
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (e.target.value.trim()) setSelectedTheme(""); // Clear selection when typing
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your technology domain..."
                  className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-500 resize-none min-h-[2.5rem] max-h-[2.5rem]"
                  rows={1}
                />
              </div>

              {/* Submit Button - Made shorter */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-neutral-300 mb-2 opacity-0">
                  Action
                </label>
                {isLoading ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onCancel}
                    className="w-full flex items-center justify-center gap-2 h-10"
                  >
                    <StopCircle className="h-4 w-4" />
                    Stop Research
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-10"
                  >
                    Start Building Radar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* OR Divider - Only show on smaller screens */}
            <div className="flex items-center gap-4 lg:hidden mt-6">
              <div className="flex-1 h-px bg-neutral-600"></div>
              <span className="text-neutral-400 text-sm">OR</span>
              <div className="flex-1 h-px bg-neutral-600"></div>
            </div>
          </form>

          {/* Radar with Original Interactive Legend - Fixed container height */}
          <div className="w-full mb-6">
            <div className="min-h-[480px]" style={{ contain: 'layout size' }}>
              <TechRadarV8 radarData={radarData} isLoading={isLoading} />
            </div>
          </div>

          {/* Agent History and Charts Section - Responsive layout */}
          <div className="border-t border-neutral-700 pt-6 mt-8 sm:mt-16 lg:mt-64">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]" style={{ contain: 'layout' }}>
              
              {/* Compressed Agent History - Mobile full width, desktop left column */}
              <div className="lg:col-span-1 order-1 lg:order-1">
                <div className="bg-black border border-neutral-700 rounded-lg h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col" style={{ contain: 'layout size' }}>
                  <div className="p-4 sm:p-6 border-b border-neutral-700">
                    <h3 className="text-lg sm:text-xl font-semibold text-neutral-100 flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-neutral-500'}`}></div>
                      Agent Process
                      {activityEvents.length > 0 && (
                        <span className="ml-auto text-xs sm:text-sm text-neutral-400 bg-neutral-800 px-2 sm:px-3 py-1 rounded-full">
                          {activityEvents.length} steps
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    {activityEvents.length > 0 ? (
                      <div 
                        ref={agentStepsRef}
                        className="h-full overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent"
                      >
                        {activityEvents.map((event, index) => (
                          <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-neutral-900/50 to-neutral-800/30 rounded-lg border border-neutral-700/50 hover:border-blue-500/30 transition-all duration-200">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-neutral-100 font-medium mb-1 sm:mb-2 text-sm sm:text-base leading-tight">{event.title}</div>
                              <div className="text-neutral-400 text-xs sm:text-sm leading-relaxed">{event.data}</div>
                            </div>
                            <div className="text-xs text-neutral-500 bg-neutral-800 px-2 sm:px-3 py-1 rounded-full flex-shrink-0 font-mono">
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center p-4 sm:p-6">
                        <div className="text-center">
                          <div className="text-neutral-500 text-sm sm:text-base">
                            {isLoading ? (
                              <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                                <span>Initializing AI agents...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-700 rounded-full flex items-center justify-center">
                                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-neutral-500 rounded-full"></div>
                                </div>
                                <span>No active process</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Technology Category Chart - Mobile full width, desktop middle column */}
              <div className="lg:col-span-1 order-2" style={{ contain: 'layout size' }}>
                <TechCategoryChart radarData={radarData} />
              </div>

              {/* Adoption Levels Chart - Mobile full width, desktop right column */}
              <div className="lg:col-span-1 order-3" style={{ contain: 'layout size' }}>
                <AdoptionLevelsChart radarData={radarData} />
              </div>
            </div>
          </div>

          {/* Summary Section - Always show */}
          <SummarySection radarData={radarData} isLoading={isLoading} />

          {/* Footer - Always show */}
          <div className="text-center mt-8 mb-6">
            <p className="text-xs text-neutral-500">
              Created by Diversa
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
