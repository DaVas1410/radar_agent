import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
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
    effort: string,
    apiConfig?: { apiKey: string; model: string }
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
  radarData?: any;
  activityEvents?: any[];
}

const PREDEFINED_THEMES = [
  {
    title: "AI Agents",
    description: "Autonomous agents, multi-agent systems, and intelligent automation",
    topics: "LangGraph, CrewAI, AutoGen, Agent frameworks, Multi-agent coordination, Tool calling"
  },
  {
    title: "AI Governance",
    description: "Principles and practices for responsible AI development and deployment",
    topics: "Fairness, Accountability, Transparency, Privacy, Security, Bias Mitigation"
  },
  {
    title: "Artificial Intelligence",
    description: "Latest frameworks, tools, and platforms for AI/ML development",
    topics: "TensorFlow, PyTorch, Hugging Face, OpenAI APIs, LangChain, MLOps"
  },
  {
    title: "Computer Vision",
    description: "Technologies and techniques for image and video analysis",
    topics: "OpenCV, TensorFlow, PyTorch, Keras, YOLO, GANs"
  },
  {
    title: "Data Engineering",
    description: "Big data processing, streaming, and analytics platforms",
    topics: "Apache Kafka, Spark, Airflow, dbt, Snowflake, Databricks"
  },
  {
    title: "Data Science",
    description: "Statistical analysis, predictive modeling, and data-driven insights",
    topics: "Pandas, NumPy, Scikit-learn, Jupyter, R, Statistical modeling, Feature engineering"
  },
  {
    title: "Data Visualization",
    description: "Tools and techniques for visualizing data and insights",
    topics: "Matplotlib, Seaborn, Plotly, D3.js, Tableau, Power BI"
  },
  {
    title: "Human-Machine Interaction",
    description: "Interfaces and systems for human-computer collaboration",
    topics: "UI/UX for AI, Conversational AI, Voice interfaces, Gesture recognition, Augmented reality"
  },
  {
    title: "Machine Learning",
    description: "Core ML algorithms, frameworks, and deployment strategies",
    topics: "Supervised learning, Unsupervised learning, Deep learning, Model deployment, AutoML"
  },
  {
    title: "ML-Ops",
    description: "Operations and lifecycle management for machine learning systems",
    topics: "MLflow, Kubeflow, Model versioning, CI/CD for ML, Model monitoring, Feature stores"
  },
  {
    title: "Multimodal AI",
    description: "Technologies and frameworks for integrating multiple AI modalities",
    topics: "Vision, Language, Audio, Robotics, Cross-Modal Learning"
  },
  {
    title: "Natural Language Processing",
    description: "Techniques and tools for processing and analyzing human language data",
    topics: "Tokenization, Named Entity Recognition, Sentiment Analysis, Transformers, BERT, GPT"
  },
  {
    title: "Spatial Data Science",
    description: "Tools and techniques for spatial data analysis and visualization",
    topics: "Geopandas, Folium, Shapely, Rasterio, Mapbox, Deck.gl"
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
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
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
    
    // Validate API key
    if (!apiKey.trim()) {
      alert("Please enter your Gemini API key to proceed.");
      return;
    }
    
    if (!apiKey.startsWith("AIza")) {
      alert("Please enter a valid Gemini API key (should start with 'AIza').");
      return;
    }
    
    // Pass API configuration properly via callback
    handleSubmit(topic, effort, { apiKey, model: selectedModel });
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

  const isSubmitDisabled = (!selectedTheme && !inputValue.trim()) || !apiKey.trim() || isLoading;

  return (
    <>
      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-[100rem] mx-auto px-10 py-4 flex items-center justify-between">
          {/* Left side - Title only */}
          <div className="text-neutral-100 text-lg font-semibold">
            Generative Tech Radar
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
                    <li>• <strong>Low:</strong> Fast analysis with ~50 technologies (2-4 minutes)</li>
                    <li>• <strong>Medium:</strong> Balanced analysis with ~70 technologies (3-6 minutes)</li>
                    <li>• <strong>High:</strong> Comprehensive analysis with ~100 technologies (5-10 minutes)</li>
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

          {/* API Configuration Section */}
          <div className="mb-8">
            <div className={`rounded-lg p-6 transition-colors duration-300 ${
              apiKey.trim() 
                ? "bg-neutral-900/50 border border-neutral-700" 
                : "bg-red-900/20 border border-red-500/50"
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
                apiKey.trim() ? "text-neutral-200" : "text-red-200"
              }`}>
                🔑 API Configuration {apiKey.trim() ? "✓" : "Required"}
              </h3>
              <p className={`text-sm mb-6 transition-colors duration-300 ${
                apiKey.trim() ? "text-neutral-300" : "text-red-300"
              }`}>
                {apiKey.trim() 
                  ? "API key configured successfully. Ready to generate technology radars." 
                  : "To use this service, you need to provide your own Google Gemini API key."
                }
                {!apiKey.trim() && (
                  <>
                    {" "}Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Google AI Studio</a>.
                  </>
                )}
                <br />
                <span className="text-amber-300 text-xs mt-2 block">💡 Estimated cost: $0.10-$0.50 per radar depending on size and model selection.</span>
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* API Key Input */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Gemini API Key *
                    <span className="text-xs text-neutral-500 block">Your API key is not stored and only used for this session</span>
                  </label>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Google Gemini API key (AIza...)"
                    className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-500 font-mono h-10"
                    type="password"
                    autoComplete="off"
                  />
                </div>

                {/* Model Selection */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Gemini Model
                    <span className="text-xs text-neutral-500 block">Choose the AI model to use</span>
                  </label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-700 border-neutral-600">
                      <SelectItem value="gemini-2.5-flash" className="text-neutral-100 hover:bg-neutral-600">
                        Gemini 2.5 Flash (Recommended)
                      </SelectItem>
                      <SelectItem value="gemini-2.0-flash-exp" className="text-neutral-100 hover:bg-neutral-600">
                        Gemini 2.0 Flash Experimental
                      </SelectItem>
                      <SelectItem value="gemini-1.5-pro" className="text-neutral-100 hover:bg-neutral-600">
                        Gemini 1.5 Pro
                      </SelectItem>
                      <SelectItem value="gemini-1.5-flash" className="text-neutral-100 hover:bg-neutral-600">
                        Gemini 1.5 Flash
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleFormSubmit} className="mb-8">
            {/* Horizontal Configuration Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Popular Domains Dropdown */}
              <div className="lg:col-span-1 h-[76px] flex flex-col">
                <div className="h-[48px] flex flex-col justify-start mb-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3h18v18H3z"/>
                      <path d="M9 9h6v6H9z"/>
                      <path d="M3 9h6"/>
                      <path d="M15 9h6"/>
                      <path d="M9 3v6"/>
                      <path d="M9 15v6"/>
                    </svg>
                    <span>Popular Tech Domains</span>
                  </div>
                  <span className="text-xs text-neutral-500">Pre-configured domains for quick start</span>
                </div>
                <Select value={selectedTheme} onValueChange={handleThemeSelect}>
                  <SelectTrigger className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 h-[36px]">
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

              {/* Custom Input - Moved to second position */}
              <div className="lg:col-span-1 h-[76px] flex flex-col">
                <div className="h-[48px] flex flex-col justify-start mb-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    <span>Custom Topic</span>
                  </div>
                  <span className="text-xs text-neutral-500">For niche or emerging areas</span>
                </div>
                <Textarea
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (e.target.value.trim()) setSelectedTheme(""); // Clear selection when typing
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your technology domain..."
                  className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-500 resize-none h-[36px] min-h-[36px] max-h-[36px]"
                  rows={1}
                />
              </div>

              {/* Research Effort - Moved to third position */}
              <div className="lg:col-span-1 h-[76px] flex flex-col">
                <div className="h-[48px] flex flex-col justify-start mb-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                    <Brain className="h-4 w-4 text-neutral-400" />
                    <span>Research Effort</span>
                  </div>
                  <span className="text-xs text-neutral-500">Analysis depth and technology count</span>
                </div>
                <Select value={effort} onValueChange={setEffort}>
                  <SelectTrigger className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 h-[36px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-700 border-neutral-600">
                    <SelectItem value="low" className="text-neutral-100 hover:bg-neutral-600">
                      Low
                    </SelectItem>
                    <SelectItem value="medium" className="text-neutral-100 hover:bg-neutral-600">
                      Medium
                    </SelectItem>
                    <SelectItem value="high" className="text-neutral-100 hover:bg-neutral-600">
                      High
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="lg:col-span-1 h-[76px] flex flex-col">
                <div className="h-[48px] flex flex-col justify-start mb-1 opacity-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                    <span>Action</span>
                  </div>
                  <span className="text-xs text-neutral-500">.</span>
                </div>
                {isLoading ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onCancel}
                    className="w-full flex items-center justify-center gap-2 h-[36px]"
                  >
                    <StopCircle className="h-4 w-4" />
                    Stop Research
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-[36px]"
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
              AI agent Developed by Diversa
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
