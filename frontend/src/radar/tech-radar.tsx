"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { RadarData, TechnologyPosition, RadarConfig } from "./radar-data"

interface RadarItem {
  name: string
  description: string
  quadrant: string
  ring: string
  score: number
  rationale: string
  x: number
  y: number
  color: string
  strokeColor: string
  id: number
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: {
    name: string
    rationale: string
  } | null
}

interface TechRadarProps {
  radarData: RadarData | null;
  isLoading?: boolean;
}

// Updated color scheme for dark background - keeping same colors as before
const ENHANCED_COLORS = {
  quadrants: {
    Techniques: {
      primary: "#0ea5e9", // Blue - same as original
      secondary: "#7A92E3",
      light: "#E8EEFF",
      gradient: "from-blue-400 to-blue-500",
    },
    Tools: {
      primary: "#10b981", // Green - same as original  
      secondary: "#7D9355",
      light: "#F0F4E8",
      gradient: "from-green-400 to-green-500",
    },
    Platforms: {
      primary: "#f59e0b", // Amber - same as original
      secondary: "#E8E6E3",
      light: "#F8F7F6",
      gradient: "from-gray-300 to-gray-400",
    },
    "Languages & Frameworks": {
      primary: "#ef4444", // Red - same as original
      secondary: "#A3A38C",
      light: "#F2F2EE",
      gradient: "from-yellow-400 to-yellow-500",
    },
  },
  rings: {
    ADOPT: {
      color: "#10b981",
      background: "#d1fae5",
      border: "#6ee7b7",
    },
    TRIAL: {
      color: "#f59e0b",
      background: "#fef3c7", 
      border: "#fcd34d",
    },
    ASSESS: {
      color: "#f97316",
      background: "#fed7aa",
      border: "#fdba74",
    },
    HOLD: {
      color: "#6b7280",
      background: "#f3f4f6",
      border: "#d1d5db",
    },
  },
}

// Memoized tooltip component
const Tooltip = memo(({ tooltip }: { tooltip: TooltipState }) => {
  if (!tooltip.visible || !tooltip.content) return null

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-5 max-w-md pointer-events-none"
      style={{
        left: tooltip.x + 10,
        top: tooltip.y - 10,
      }}
    >
      <div className="font-bold text-base text-gray-900 mb-1">{tooltip.content.name}</div>
      <div className="text-xs text-blue-700 leading-relaxed">{tooltip.content.rationale}</div>
    </div>
  )
})

Tooltip.displayName = "Tooltip"

// Memoized sidebar component  
const Sidebar = memo(
  ({
    selectedItem,
    onClose,
  }: {
    selectedItem: RadarItem | null
    onClose: () => void
  }) => {
    if (!selectedItem) return null

    const quadrantColors = ENHANCED_COLORS.quadrants[selectedItem.quadrant as keyof typeof ENHANCED_COLORS.quadrants]

    return (
      <div className="space-y-4 h-full flex flex-col">
        {/* How to use section at the top */}
        <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
          <h4 className="text-base font-medium mb-3 text-gray-200">Selected Technology</h4>
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-lg text-white">{selectedItem.name}</h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline" style={{ color: quadrantColors?.primary, borderColor: quadrantColors?.primary }}>
                  {selectedItem.quadrant}
                </Badge>
                <Badge variant="outline" className="text-white border-gray-500">
                  {selectedItem.ring}
                </Badge>
                <Badge variant="outline" className="text-white border-gray-500">
                  Score: {selectedItem.score}/10
                </Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-300 mb-2">Description</h4>
              <p className="text-sm text-gray-200 leading-relaxed">{selectedItem.description}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-300 mb-2">Analysis</h4>
              <p className="text-sm text-gray-200 leading-relaxed">{selectedItem.rationale}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    )
  },
)

Sidebar.displayName = "Sidebar"

export function TechRadar({ radarData: propRadarData, isLoading = false }: TechRadarProps) {
  const [radarData, setRadarData] = useState<RadarData | null>(propRadarData)
  const [selectedItem, setSelectedItem] = useState<RadarItem | null>(null)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  })

  useEffect(() => {
    if (propRadarData) {
      setRadarData(propRadarData)
    }
  }, [propRadarData])

  // Fixed configuration to match original c8 sizes
  const config = {
    size: 400, // Reduced from 480 to fit better
    dotSize: 6, // Slightly smaller dots
    hoveredDotSize: 8,
    fontSize: "text-xs", // Smaller text
  }

  const center = config.size / 2
  const maxRadius = center - 40

  // Ring configuration - adjusted for better proportions
  const rings = useMemo(
    () => [
      { name: "ADOPT", radius: 60 },
      { name: "TRIAL", radius: 100 },
      { name: "ASSESS", radius: 140 },
      { name: "HOLD", radius: 180 },
    ],
    [],
  )

  // Function to calculate color with alpha transparency based on ring
  const getColorByRing = useCallback((quadrantColor: string, ring: string): string => {
    const alphaMap = {
      ADOPT: 0.9,
      TRIAL: 0.7, 
      ASSESS: 0.5,
      HOLD: 0.3,
    }

    const alpha = alphaMap[ring as keyof typeof alphaMap] || 0.8

    // Convert hex to RGB and apply alpha
    const hex = quadrantColor.replace("#", "")
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }, [])

  // Enhanced quadrant configuration - matching original colors
  const quadrants = useMemo(
    () => [
      { name: "Techniques", key: "techniques", startAngle: 180, endAngle: 270, ...ENHANCED_COLORS.quadrants.Techniques },
      { name: "Tools", key: "tools", startAngle: 270, endAngle: 360, ...ENHANCED_COLORS.quadrants.Tools },
      { name: "Platforms", key: "platforms", startAngle: 90, endAngle: 180, ...ENHANCED_COLORS.quadrants.Platforms },
      {
        name: "Languages & Frameworks",
        key: "languagesframeworks", 
        startAngle: 0,
        endAngle: 90,
        ...ENHANCED_COLORS.quadrants["Languages & Frameworks"],
      },
    ],
    [],
  )

  // Enhanced position calculation with collision detection
  const calculatePosition = useCallback(
    (item: any, allItems: any[], itemIndex: number): { x: number; y: number } => {
      const quadrant = quadrants.find((q) => q.key === item.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", ""))
      const ring = rings.find((r) => r.name === item.ring)

      if (!quadrant || !ring) return { x: center, y: center }

      // Create a seeded random number generator for consistency
      const seed = item.name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      const random = (seedValue: number) => {
        const x = Math.sin(seedValue) * 10000
        return x - Math.floor(x)
      }

      // Get already positioned items in the same ring/quadrant for collision detection
      const existingPositions = allItems.slice(0, itemIndex)
        .filter((existing: any) => existing.ring === item.ring && existing.quadrant === item.quadrant)
        .map((existing: any) => ({ x: existing.x, y: existing.y }))

      // Convert angles to radians
      const startAngleRad = (quadrant.startAngle * Math.PI) / 180
      const endAngleRad = (quadrant.endAngle * Math.PI) / 180

      // Handle angle wrapping for quadrants that cross 0°
      let angleRange = endAngleRad - startAngleRad
      if (angleRange <= 0) angleRange += 2 * Math.PI

      // Calculate ring boundaries
      const minRadius = ring === rings[0] ? 25 : rings[rings.indexOf(ring) - 1].radius + 15
      const maxRadius = ring.radius - 15
      const radiusRange = maxRadius - minRadius

      // Minimum distance between points to avoid overlap
      const minDistance = 25

      // Try to find a position with multiple attempts
      let attempts = 0
      const maxAttempts = 50
      let bestPosition = { x: center, y: center }
      let bestDistance = 0

      while (attempts < maxAttempts) {
        // Use different seed variations for each attempt
        const attemptSeed = seed + attempts * 1337

        // Generate angle with more even distribution
        const normalizedIndex = itemIndex / Math.max(allItems.length - 1, 1)
        const baseAngle = startAngleRad + (angleRange * 0.8 * normalizedIndex) + (angleRange * 0.1)
        const randomAngleOffset = (random(attemptSeed) - 0.5) * angleRange * 0.3
        const angle = baseAngle + randomAngleOffset

        // Generate radius with some randomness but better distribution
        const radiusProgress = random(attemptSeed + 1)
        const radius = minRadius + (radiusProgress * radiusRange)

        // Calculate position
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)

        // Check for collisions with existing positions
        let hasCollision = false
        let minDistanceToExisting = Number.MAX_VALUE

        for (const existing of existingPositions) {
          const distance = Math.sqrt(Math.pow(x - existing.x, 2) + Math.pow(y - existing.y, 2))
          minDistanceToExisting = Math.min(minDistanceToExisting, distance)
          
          if (distance < minDistance) {
            hasCollision = true
            break
          }
        }

        // If no collision, use this position
        if (!hasCollision || existingPositions.length === 0) {
          return { x, y }
        }

        // Keep track of the best position (furthest from other points)
        if (minDistanceToExisting > bestDistance) {
          bestDistance = minDistanceToExisting
          bestPosition = { x, y }
        }

        attempts++
      }

      // If we couldn't find a collision-free position, use the best one we found
      return bestPosition
    },
    [quadrants, rings, center],
  )

  const processedData = useMemo((): RadarItem[] => {
    if (!radarData?.radar_data) return []

    // First pass: create items with temporary positions
    const tempItems = radarData.radar_data.map((item: any, globalIndex: number) => ({
      ...item,
      id: globalIndex,
      x: center,
      y: center
    }))

    // Second pass: calculate positions with collision detection
    return tempItems.map((item: any, globalIndex: number) => {
      const position = calculatePosition(item, tempItems, globalIndex)
      const quadrant = quadrants.find((q) => q.key === item.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", ""))

      // Use alpha transparency based on ring position
      const baseColor = quadrant?.primary || "#666"
      const gradientColor = getColorByRing(baseColor, item.ring)
      const strokeColor = quadrant?.primary || "#666"

      const processedItem = {
        ...item,
        x: position.x,
        y: position.y,
        color: gradientColor,
        strokeColor: strokeColor,
      }

      // Update the temp item for subsequent collision detection
      tempItems[globalIndex] = processedItem

      return processedItem
    })
  }, [radarData, calculatePosition, quadrants, getColorByRing])

  // Optimized mouse event handlers
  const handleMouseEnter = useCallback((event: React.MouseEvent, item: RadarItem) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      content: {
        name: item.name,
        rationale: item.rationale,
      },
    })
    setHoveredItem(item.id)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0, content: null })
    setHoveredItem(null)
  }, [])

  const handleClick = useCallback((item: RadarItem) => {
    setSelectedItem(item)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setSelectedItem(null)
  }, [])

  if (!radarData && !isLoading) {
    return (
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[750px]">
          <div className="lg:col-span-2">
            <div className="p-6 bg-black rounded-lg h-full flex flex-col border border-neutral-700">
              <div className="relative flex justify-center items-center flex-1">
                <div className="w-[400px] h-[400px] flex-shrink-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-6 h-6 bg-neutral-500 rounded-full"></div>
                    </div>
                    <p className="text-neutral-400 text-base">No radar data available</p>
                    <p className="text-neutral-600 text-xs">Start building a radar to see technology visualization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 h-full flex flex-col">
            <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
              <h4 className="text-sm font-medium mb-3 text-gray-200">How to use</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Start by selecting a technology domain or entering a custom topic to generate your radar.
              </p>
            </div>
            <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-1 flex items-center justify-center">
              <p className="text-neutral-500 text-sm">Waiting for data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !radarData) {
    return (
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[675px]">
          <div className="lg:col-span-2">
            <div className="p-6 bg-black rounded-lg h-full flex flex-col border border-neutral-700">
              <div className="relative flex justify-center items-center flex-1">
                <div className="w-[400px] h-[400px] flex-shrink-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-neutral-400 text-base">Generating technology radar...</p>
                    <p className="text-neutral-600 text-xs">AI agents are researching and analyzing technologies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 h-full flex flex-col">
            <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
              <h4 className="text-sm font-medium mb-3 text-gray-200">Research in Progress</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Our AI agents are gathering and analyzing the latest technology information for your radar.
              </p>
            </div>
            <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-1 flex items-center justify-center">
              <div className="animate-pulse text-neutral-500 text-sm">Processing data...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        {/* Radar Chart - Absolutely fixed container size */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-black rounded-lg h-full flex flex-col border border-neutral-700">
            {radarData && radarData.topic && (
              <div className="text-left mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white mb-3">{radarData.topic}</h2>
                <p className="text-sm text-gray-300">
                  Generated: {radarData.generated_date} at{" "}
                  {radarData.generated_time} • {processedData.length} technologies analyzed • {radarData.research_metadata?.sources_analyzed || 0} sources analyzed
                </p>
              </div>
            )}
            <div className="relative flex justify-center items-center flex-1">
              <div className="w-[400px] h-[400px] flex-shrink-0">
                <svg
                  width="400"
                  height="400"
                  viewBox="-200 -200 400 400"
                  className="border rounded-full bg-black w-full h-full"
                >
                  {/* Ring circles */}
                  {rings.map((ring) => (
                    <circle
                      key={ring.name}
                      cx="0"
                      cy="0"
                      r={ring.radius}
                      fill="none"
                      stroke="#4b5563"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  ))}

                  {/* Quadrant division lines */}
                  <line x1="-200" y1="0" x2="200" y2="0" stroke="#4b5563" strokeWidth="2" opacity="0.8" />
                  <line x1="0" y1="-200" x2="0" y2="200" stroke="#4b5563" strokeWidth="2" opacity="0.8" />

                  {/* Quadrant labels */}
                  {quadrants.map((quadrant, index) => {
                    const positions = [
                      { x: -100, y: -180 }, // Techniques (top-left)
                      { x: 100, y: -180 },  // Tools (top-right)
                      { x: -100, y: 190 },  // Platforms (bottom-left)
                      { x: 100, y: 190 },   // Languages & Frameworks (bottom-right)
                    ]

                    return (
                      <text
                        key={quadrant.name}
                        x={positions[index].x}
                        y={positions[index].y}
                        textAnchor="middle"
                        className="text-xs font-bold transition-all duration-300"
                        fill={quadrant.primary}
                      >
                        {quadrant.name}
                      </text>
                    )
                  })}

                  {/* Ring labels */}
                  {rings.map((ring) => (
                    <text
                      key={`label-right-${ring.name}`}
                      x={ring.radius - 15}
                      y={-5}
                      textAnchor="end"
                      className="text-xs font-bold transition-all duration-300"
                      fill="#9ca3af"
                    >
                      {ring.name}
                    </text>
                  ))}

                  {/* Technology dots */}
                  {processedData.map((item) => {
                    const isHovered = hoveredItem === item.id
                    const isSelected = selectedItem?.id === item.id
                    const opacity = selectedItem && selectedItem.id !== item.id ? 0.4 : 1

                    // Convert coordinates from center-based to SVG coordinate system
                    const svgX = item.x - center
                    const svgY = item.y - center

                    return (
                      <g key={item.id}>
                        {/* Glow effect for hovered/selected items */}
                        {(isHovered || isSelected) && (
                          <circle
                            cx={svgX}
                            cy={svgY}
                            r={config.hoveredDotSize + 4}
                            fill={item.color}
                            opacity="0.2"
                            className="animate-pulse"
                          />
                        )}

                        {/* Main dot */}
                        <circle
                          cx={svgX}
                          cy={svgY}
                          r={isHovered ? config.hoveredDotSize : config.dotSize}
                          fill={item.color}
                          stroke={item.strokeColor}
                          strokeWidth="2"
                          className="cursor-pointer transition-all duration-200 ease-in-out"
                          onMouseEnter={(e) => handleMouseEnter(e, item)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleClick(item)}
                          opacity={opacity}
                          style={{
                            filter: isSelected ? "drop-shadow(0 0 6px rgba(255,255,255,0.3))" : "none",
                          }}
                        />

                        {/* Dot number */}
                        <text
                          x={svgX}
                          y={svgY + 1}
                          fontSize="6"
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="pointer-events-none font-bold"
                        >
                          {item.id + 1}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Enhanced tooltip */}
              <Tooltip tooltip={tooltip} />
            </div>
          </div>
        </div>

        {/* Interactive Legend/Sidebar */}
        {selectedItem ? (
          <Sidebar selectedItem={selectedItem} onClose={handleCloseSidebar} />
        ) : (
          <div className="space-y-4 h-full flex flex-col">
            {/* How to use section */}
            <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
              <h4 className="text-base font-medium mb-3 text-gray-200">How to use</h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                Click on any technology dot to see detailed information. Hover for quick rationale view.
              </p>
            </div>

            {/* Research Overview */}
            {radarData?.research_metadata && (
              <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
                <h3 className="text-lg font-semibold mb-4 text-white">Research Overview</h3>
                <div className="space-y-3 text-sm text-white">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Research Loops:</span>
                    <span className="font-medium">{radarData.research_metadata.research_loops || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Sources Analyzed:</span>
                    <span className="font-medium">{radarData.research_metadata.sources_analyzed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Completion Rate:</span>
                    <span className="font-medium">{radarData.research_metadata.completion_rate || 0}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ring meanings */}
            <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-1 min-h-0 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-white">Ring Meanings</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-gray-100">ADOPT:</strong>{" "}
                  <span className="text-gray-300">Proven and mature, ready for widespread use</span>
                </div>
                <div>
                  <strong className="text-gray-100">TRIAL:</strong>{" "}
                  <span className="text-gray-300">Worth pursuing with caution, gaining traction</span>
                </div>
                <div>
                  <strong className="text-gray-100">ASSESS:</strong>{" "}
                  <span className="text-gray-300">Worth exploring and understanding the implications</span>
                </div>
                <div>
                  <strong className="text-gray-100">HOLD:</strong>{" "}
                  <span className="text-gray-300">Proceed with caution or avoid</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
