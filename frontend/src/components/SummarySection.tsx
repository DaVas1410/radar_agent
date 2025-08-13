import { useState } from "react";
import { Button } from "./ui/button";
import { Download, FileText, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                disabled
                variant="outline"
                size="sm"
                className="border-neutral-600 text-neutral-500 bg-transparent opacity-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Summary
              </Button>
              <Button
                disabled
                className="bg-blue-600 text-white opacity-50"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
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
        </div>
      </div>
    );
  }

  // Function to add logo to header with optimized horizontal logos
  const addLogoToHeader = async () => {
    try {
      // Try multiple logo paths, using Artboard logos for PDF display
      const logoOptions = [
        '/Artboard 2 copy 4.png',
        '/Artboard 2 copy 3.png',
        './Artboard 2 copy 4.png',
        './Artboard 2 copy 3.png',
        'Artboard 2 copy 4.png',
        'Artboard 2 copy 3.png'
      ];
      
      let logoResponse: Response | null = null;
      
      for (const path of logoOptions) {
        try {
          logoResponse = await fetch(path);
          if (logoResponse.ok) {
            console.log(`Logo loaded successfully from: ${path}`);
            break;
          }
        } catch (fetchError) {
          console.warn(`Failed to fetch logo from ${path}:`, fetchError);
        }
      }
      
      if (!logoResponse || !logoResponse.ok) {
        throw new Error('Logo not found in any path');
      }
      
      const logoBlob = await logoResponse.blob();
      
      // Ensure we have a valid image blob
      if (!logoBlob.type.startsWith('image/')) {
        throw new Error('Invalid image type');
      }
      
      // Use original logo without resizing for best quality
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Use original dimensions
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          
          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataURL = canvas.toDataURL('image/png');
            console.log(`Logo loaded at original size: ${width}x${height}`);
            resolve(dataURL);
          } else {
            reject(new Error('Cannot get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(logoBlob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
      throw error;
    }
  };

  // Function to add header to each page
  const addHeaderToPage = async (doc: jsPDF) => {
    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add ultra-slim colored background header
      const headerHeight = 18; // Ultra-slim header
      doc.setFillColor(38, 38, 38); // #262626 color to match page sections
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      
      // Try to add logo
      try {
        const logoDataURL = await addLogoToHeader();
        
        // Smaller logo with increased width
        const logoSize = 6; // Height remains 6px
        const logoWidth = 8; // Width increased by 2px (from 6px to 8px)
        const logoX = pageWidth - logoWidth - 10; // Right side with small margin
        const logoY = (headerHeight - logoSize) / 2; // Center vertically in header
        
        doc.addImage(logoDataURL, 'PNG', logoX, logoY, logoWidth, logoSize);
        console.log('Logo added to PDF header successfully');
      } catch (logoError) {
        console.warn('Failed to add logo to header:', logoError);
        
        // Text fallback - add "DIVERSA" text in the logo position
        doc.setFontSize(10); // Match main title font size
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const fallbackText = "DIVERSA";
        const fallbackX = pageWidth - 40;
        doc.text(fallbackText, fallbackX, headerHeight / 2 + 1); // Align with main title text
      }
      
      // Add title text on the left side - reduce size by 1pt
      doc.setFontSize(9); // Reduced from 10pt to 9pt
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Generative Tech Radar Report', 10, headerHeight / 2 + 1); // Moved up to align with logo center
      
      // Reset text color for document body
      doc.setTextColor(0, 0, 0);
      
    } catch (error) {
      console.error('Error adding header:', error);
      // Continue without header if there's an error
    }
  };

  const handleDownloadSummary = async () => {
    const doc = new jsPDF();
    
    // Add header with logo and colored background
    try {
      await addHeaderToPage(doc);
    } catch (error) {
      console.error('Failed to add header:', error);
      // Continue with PDF generation even if header fails
    }
    
    // Set up the document
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 35; // Adjusted for 18px ultra-slim header + margin

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = `${radarData.topic} Tech Radar`;
    doc.text(title, margin, yPosition);
    yPosition += lineHeight * 2;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${radarData.generated_date} at ${radarData.generated_time}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Total Technologies: ${radarData.total_elements}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Reflection Loops: ${radarData.research_metadata.research_loops} | Sources: ${radarData.research_metadata.sources_analyzed}`, margin, yPosition);
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
      if (yPosition + lineHeight * 2 > pageHeight - margin) {
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
      
      // Add link if available
      if (tech.source_url) {
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 0, 255); // Blue color for link
        const linkLine = `   Link: ${tech.source_url}`;
        const linkLines = doc.splitTextToSize(linkLine, pageWidth - 2 * margin);
        for (const linkLine of linkLines) {
          if (yPosition + lineHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(linkLine, margin, yPosition);
          yPosition += lineHeight;
        }
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
      }
      
      yPosition += 2; // Add small spacing between technologies
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    
    // Left side footer text
    doc.text('AI-generated', margin, footerY);
    
    // Right side footer text
    const rightMargin = pageWidth - margin;
    doc.text('Designed by Diversa', rightMargin, footerY, { align: 'right' });

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
              className="border-neutral-600 hover:border-neutral-500 text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800"
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
            <CardTitle className="text-base sm:text-lg text-white">AI-Generated Report</CardTitle>
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
      </div>
    </div>
  );
};
