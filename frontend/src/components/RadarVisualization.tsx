import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface RadarElement {
  name: string;
  description: string;
  quadrant: string;
  ring: string;
  score: number;
  rationale: string;
}

interface RadarData {
  topic: string;
  generated_date: string;
  total_elements: number;
  radar_data: RadarElement[];
  statistics: {
    quadrants: Record<string, number>;
    rings: Record<string, number>;
  };
}

interface RadarVisualizationProps {
  data: RadarData | null;
  isVisible: boolean;
}

export const RadarVisualization: React.FC<RadarVisualizationProps> = ({ 
  data, 
  isVisible 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedElement, setSelectedElement] = useState<RadarElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    element: RadarElement | null;
  }>({ visible: false, x: 0, y: 0, element: null });

  const quadrants = [
    { name: 'Tools', angle: 0, color: '#8B5CF6' },
    { name: 'Techniques', angle: 90, color: '#06B6D4' },
    { name: 'Platforms', angle: 180, color: '#10B981' },
    { name: 'Languages & Frameworks', angle: 270, color: '#F59E0B' }
  ];

  const rings = [
    { name: 'Adopt', radius: 120, color: '#10B981' },
    { name: 'Trial', radius: 180, color: '#06B6D4' },
    { name: 'Assess', radius: 240, color: '#F59E0B' },
    { name: 'Hold', radius: 300, color: '#EF4444' }
  ];

  useEffect(() => {
    if (!data || !isVisible || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 650;
    const height = 650;
    const centerX = width / 2;
    const centerY = height / 2;

    svg.attr('width', width).attr('height', height);

    // Create main group
    const g = svg.append('g').attr('transform', `translate(${centerX},${centerY})`);

    // Draw rings
    rings.forEach((ring) => {
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', ring.radius)
        .attr('fill', 'none')
        .attr('stroke', '#374151')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5');

      // Ring labels
      g.append('text')
        .attr('x', 5)
        .attr('y', -ring.radius + 15)
        .attr('fill', ring.color)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(ring.name);
    });

    // Draw quadrant lines
    g.append('line')
      .attr('x1', -300).attr('y1', 0)
      .attr('x2', 300).attr('y2', 0)
      .attr('stroke', '#374151')
      .attr('stroke-width', 1);

    g.append('line')
      .attr('x1', 0).attr('y1', -300)
      .attr('x2', 0).attr('y2', 300)
      .attr('stroke', '#374151')
      .attr('stroke-width', 1);

    // Quadrant labels
    quadrants.forEach((quadrant) => {
      const angle = (quadrant.angle - 90) * Math.PI / 180;
      const labelRadius = 320;
      const x = Math.cos(angle) * labelRadius;
      const y = Math.sin(angle) * labelRadius;

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', quadrant.color)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(quadrant.name);
    });

    // Plot elements
    const elementsWithPositions = data.radar_data.map((element) => {
      const quadrant = quadrants.find(q => q.name === element.quadrant);
      const ring = rings.find(r => r.name === element.ring);
      
      if (!quadrant || !ring) return null;

      // Random position within the quadrant and ring
      const baseAngle = (quadrant.angle - 90) * Math.PI / 180;
      const angleVariation = (Math.PI / 2) * (Math.random() - 0.5) * 0.8; // 80% of quadrant
      const angle = baseAngle + angleVariation;
      
      const prevRingRadius = ring.radius === 120 ? 0 : rings.find(r => rings.indexOf(r) === rings.findIndex(r2 => r2.name === ring.name) - 1)?.radius || 0;
      const radiusVariation = (ring.radius - prevRingRadius) * (0.3 + Math.random() * 0.4); // Between 30% and 70% of ring width
      const radius = prevRingRadius + radiusVariation;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return { ...element, x, y, quadrant, ring };
    }).filter(Boolean) as (RadarElement & { x: number; y: number; quadrant: any; ring: any })[];

    // Draw elements
    g.selectAll('.radar-element')
      .data(elementsWithPositions)
      .enter()
      .append('circle')
      .attr('class', 'radar-element')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => 3 + (d.score / 10) * 4) // Size based on score
      .attr('fill', d => d.quadrant.color)
      .attr('stroke', '#1F2937')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (3 + (d.score / 10) * 4) * 1.5)
          .attr('opacity', 1);

        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        setTooltip({
          visible: true,
          x: mouseX,
          y: mouseY,
          element: d
        });
      })
      .on('mouseout', function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 3 + (d.score / 10) * 4)
          .attr('opacity', 0.8);

        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .on('click', function(_, d) {
        setSelectedElement(d);
      });

    // Add element labels for larger elements
    g.selectAll('.radar-label')
      .data(elementsWithPositions.filter(d => d.score >= 8))
      .enter()
      .append('text')
      .attr('class', 'radar-label')
      .attr('x', d => d.x)
      .attr('y', d => d.y - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E7EB')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name);

  }, [data, isVisible]);

  if (!data || !isVisible) return null;

  return (
    <div className="relative w-full h-full bg-neutral-900 rounded-lg border border-neutral-700">
      <div className="p-4 border-b border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-100">{data.topic}</h3>
        <p className="text-sm text-neutral-400">
          {data.total_elements} elements • Generated {data.generated_date}
        </p>
      </div>
      
      <div className="relative overflow-hidden">
        <svg ref={svgRef} className="w-full"></svg>
        
        {/* Tooltip */}
        {tooltip.visible && tooltip.element && (
          <div 
            className="absolute z-10 bg-neutral-800 border border-neutral-600 rounded-lg p-3 shadow-lg max-w-xs"
            style={{ 
              left: tooltip.x + 10, 
              top: tooltip.y - 10,
              transform: tooltip.x > 400 ? 'translateX(-100%)' : 'none'
            }}
          >
            <h4 className="font-semibold text-neutral-100">{tooltip.element.name}</h4>
            <p className="text-xs text-neutral-400 mb-2">
              {tooltip.element.quadrant} • {tooltip.element.ring} • Score: {tooltip.element.score}
            </p>
            <p className="text-sm text-neutral-300">{tooltip.element.description}</p>
          </div>
        )}
      </div>

      {/* Element details panel */}
      {selectedElement && (
        <div className="absolute inset-0 bg-neutral-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-neutral-100">{selectedElement.name}</h3>
              <button 
                onClick={() => setSelectedElement(null)}
                className="text-neutral-400 hover:text-neutral-200 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-neutral-300">Quadrant: </span>
                <span className="text-sm text-neutral-100">{selectedElement.quadrant}</span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-neutral-300">Ring: </span>
                <span className="text-sm text-neutral-100">{selectedElement.ring}</span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-neutral-300">Score: </span>
                <span className="text-sm text-neutral-100">{selectedElement.score}/10</span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-neutral-300 block mb-1">Description:</span>
                <p className="text-sm text-neutral-100">{selectedElement.description}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-neutral-300 block mb-1">Rationale:</span>
                <p className="text-sm text-neutral-100">{selectedElement.rationale}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-neutral-800/90 border border-neutral-600 rounded-lg p-3">
        <div className="text-xs font-semibold text-neutral-200 mb-2">Rings</div>
        {rings.map(ring => (
          <div key={ring.name} className="flex items-center mb-1">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: ring.color }}
            ></div>
            <span className="text-xs text-neutral-300">{ring.name}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 bg-neutral-800/90 border border-neutral-600 rounded-lg p-3">
        <div className="text-xs font-semibold text-neutral-200 mb-2">Quadrants</div>
        {quadrants.map(quadrant => (
          <div key={quadrant.name} className="flex items-center mb-1">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: quadrant.color }}
            ></div>
            <span className="text-xs text-neutral-300">{quadrant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
