import { useState } from "react";
import { Button } from "./ui/button";
import { Download, FileText, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface SummarySectionProps {
  radarData: any;
  isLoading?: boolean;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ radarData, isLoading = false }) => {
  const [copied, setCopied] = useState(false);

  // Show placeholder section when no data or loading
  if (!radarData?.summary_report) {
    return (
      <div className="border-t border-neutral-700 pt-8 mt-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                Research Summary & Analysis
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base">
                {isLoading 
                  ? "AI agents are generating comprehensive analysis..."
                  : "Generate a technology radar to see detailed analysis and insights"
                }
              </p>
            </div>
          </div>

          {/* Placeholder Content */}
          <Card className="bg-black border-neutral-700">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <div className="space-y-2">
                      <p className="text-neutral-300 text-base sm:text-lg">Generating detailed analysis...</p>
                      <p className="text-neutral-500 text-sm">
                        AI agents are researching technologies and preparing comprehensive insights
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="h-8 w-8 text-neutral-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-neutral-300 text-base sm:text-lg">No analysis available</p>
                      <p className="text-neutral-500 text-sm">
                        Start building a technology radar to see AI-powered research summary, strategic insights, and downloadable reports
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Placeholder Download Action */}
          <div className="flex justify-center">
            <Card className="bg-neutral-900 border-neutral-700 opacity-50 w-full max-w-md">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">Complete Report</h3>
                    <p className="text-neutral-400 text-sm">
                      Full analysis including summary and technology list in PDF format
                    </p>
                  </div>
                  <Button
                    disabled
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadSummary = () => {
    const doc = new jsPDF();
    
    // Set up the document
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${radarData.topic} - Technology Radar Report`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${radarData.generated_date} at ${radarData.generated_time}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Total Technologies: ${radarData.total_elements}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Research Loops: ${radarData.research_metadata.research_loops} | Sources: ${radarData.research_metadata.sources_analyzed}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Summary section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Research Summary & Analysis', margin, yPosition);
    yPosition += lineHeight * 1.5;

    // Process summary text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const summaryText = radarData.summary_report;
    const lines = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
    
    for (let i = 0; i < lines.length; i++) {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(lines[i], margin, yPosition);
      yPosition += lineHeight;
    }

    // Add technology list
    yPosition += lineHeight;
    if (yPosition + lineHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Technology List', margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    radarData.radar_data.forEach((tech: any, index: number) => {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      const techLine = `${index + 1}. ${tech.name} (${tech.quadrant} - ${tech.ring}) - Score: ${tech.score}/10`;
      const techLines = doc.splitTextToSize(techLine, pageWidth - 2 * margin);
      
      for (const line of techLines) {
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      }
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Created by Diversa', margin, footerY);

    // Save the PDF
    doc.save(`${radarData.topic.replace(/\s+/g, '_')}_radar_report.pdf`);
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(radarData.summary_report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  return (
    <div className="border-t border-neutral-700 pt-8 mt-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              Research Summary & Analysis
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base">
              Comprehensive analysis and strategic insights from the AI research process
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCopySummary}
              variant="outline"
              size="sm"
              className="border-neutral-600 hover:border-blue-500 text-neutral-300 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Summary
                </>
              )}
            </Button>
            <Button
              onClick={handleDownloadSummary}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Summary Content */}
        <Card className="bg-black border-neutral-700">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base sm:text-lg text-white">AI-Generated Report</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-blue-400 border-blue-500 text-xs">
                  {radarData.research_metadata.research_loops} Research Loops
                </Badge>
                <Badge variant="outline" className="text-green-400 border-green-500 text-xs">
                  {radarData.research_metadata.sources_analyzed} Sources
                </Badge>
                <Badge variant="outline" className="text-purple-400 border-purple-500 text-xs">
                  {radarData.research_metadata.completion_rate}% Complete
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 sm:h-96 w-full">
              <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  className="text-neutral-200 leading-relaxed"
                  components={{
                    h1: ({children}) => <h1 className="text-xl font-bold text-white mb-4 mt-6 first:mt-0">{children}</h1>,
                    h2: ({children}) => <h2 className="text-lg font-semibold text-white mb-3 mt-5">{children}</h2>,
                    h3: ({children}) => <h3 className="text-base font-medium text-white mb-2 mt-4">{children}</h3>,
                    h4: ({children}) => <h4 className="text-sm font-medium text-gray-200 mb-2 mt-3">{children}</h4>,
                    p: ({children}) => <p className="text-neutral-200 mb-3 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-neutral-200">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-neutral-200">{children}</ol>,
                    li: ({children}) => <li className="text-neutral-200 leading-relaxed">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                    code: ({children}) => <code className="bg-neutral-800 text-blue-300 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                    pre: ({children}) => <pre className="bg-neutral-800 text-blue-300 p-3 rounded-lg overflow-x-auto mb-3 text-sm">{children}</pre>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-3 bg-neutral-900 rounded-r">{children}</blockquote>,
                    hr: () => <hr className="border-neutral-600 my-4" />,
                    a: ({href, children}) => <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  }}
                >
                  {radarData.summary_report}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Download Action - Single centered button */}
        <div className="flex justify-center">
          <Card className="bg-neutral-900 border-neutral-700 hover:border-blue-500 transition-all duration-200 w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">Complete Report</h3>
                  <p className="text-neutral-400 text-sm">
                    Download the full analysis including summary and technology list in PDF format
                  </p>
                </div>
                <Button
                  onClick={handleDownloadSummary}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Stats */}
        <div className="text-center pt-4 border-t border-neutral-800">
          <p className="text-neutral-500 text-xs sm:text-sm">
            Report generated on {radarData.generated_date} at {radarData.generated_time} • 
            {radarData.total_elements} technologies analyzed • 
            {radarData.research_metadata.average_score}/10 average relevance score
          </p>
        </div>
      </div>
    </div>
  );
};
