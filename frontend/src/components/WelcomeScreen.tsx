import { InputForm } from "./InputForm";
import { Card } from "./ui/card";

interface WelcomeScreenProps {
  handleSubmit: (
    submittedInputValue: string,
    effort: string
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
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
}) => (
  <div className="h-full flex flex-col px-4 py-6 max-w-6xl mx-auto">
    <div className="text-center mb-8">
      <h1 className="text-4xl md:text-5xl font-semibold text-neutral-100 mb-3">
        Tech Radar Builder
      </h1>
      <p className="text-lg md:text-xl text-neutral-400 mb-6">
        Create interactive technology radars from state-of-the-art domains
      </p>
    </div>

    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Predefined Themes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-200 mb-4">
          Popular Tech Domains
        </h2>
        <div className="grid gap-3 max-h-[500px] overflow-y-auto">
          {PREDEFINED_THEMES.map((theme, index) => (
            <Card 
              key={index} 
              className="p-4 bg-neutral-800 border-neutral-700 hover:bg-neutral-750 transition-colors cursor-pointer"
              onClick={() => handleSubmit(theme.title, "medium")}
            >
              <h3 className="font-semibold text-neutral-100 mb-2">{theme.title}</h3>
              <p className="text-sm text-neutral-400 mb-2">{theme.description}</p>
              <p className="text-xs text-neutral-500">
                <span className="font-medium">Includes:</span> {theme.topics}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-200 mb-4">
          Custom Radar Topic
        </h2>
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-200 mb-3">How it works:</h3>
            <ul className="text-sm text-neutral-400 space-y-2">
              <li>• <span className="text-neutral-300">Research:</span> Deep search for 50-60 relevant technologies</li>
              <li>• <span className="text-neutral-300">Classify:</span> Organize into quadrants (Tools, Techniques, Platforms, Languages & Frameworks)</li>
              <li>• <span className="text-neutral-300">Assess:</span> Assign to rings (Adopt, Trial, Assess, Hold) with scores</li>
              <li>• <span className="text-neutral-300">Visualize:</span> Interactive radar with detailed element information</li>
            </ul>
          </div>
          
          <InputForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={onCancel}
            hasHistory={false}
          />
          
          <div className="mt-4 text-xs text-neutral-500">
            <p><strong>Example topics:</strong> "Blockchain Development", "Game Development Tools", "Data Visualization Libraries"</p>
          </div>
        </div>
      </div>
    </div>

    <div className="text-center mt-6">
      <p className="text-xs text-neutral-500">
        Powered by Google Gemini and LangChain LangGraph
      </p>
    </div>
  </div>
);
