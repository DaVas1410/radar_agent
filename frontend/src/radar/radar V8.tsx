"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback, memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TechRadarProps {
  radarData: any | null;
  isLoading?: boolean;
}

interface RadarItem {
  name: string
  description: string
  quadrant: string
  ring: string
  score: number
  rationale: string
  source_url?: string
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

interface RadarDataCache {
  data: any
  timestamp: number
  url: string
}

// Updated color scheme for dark background
const ENHANCED_COLORS = {
  quadrants: {
    Techniques: {
      primary: "#6182D9", // Blue
      secondary: "#7A92E3", // Lighter blue
      light: "#E8EEFF", // Very light blue for badges
      gradient: "from-blue-400 to-blue-500",
    },
    Tools: {
      primary: "#6E824A", // Green
      secondary: "#7D9355", // Lighter green
      light: "#F0F4E8", // Very light green for badges
      gradient: "from-green-400 to-green-500",
    },
    Platforms: {
      primary: "#E0DEDB", // Light gray/beige
      secondary: "#E8E6E3", // Lighter version
      light: "#F8F7F6", // Very light version for badges
      gradient: "from-gray-300 to-gray-400",
    },
    "Languages & Frameworks": {
      primary: "#8F8F78", // Muted olive/gray
      secondary: "#A3A38C", // Lighter version
      light: "#F2F2EE", // Very light version for badges
      gradient: "from-yellow-400 to-yellow-500",
    },
  },
  rings: {
    Adopt: {
      color: "#10b981", // Emerald-500 - matches bar chart
      background: "#d1fae5", // Emerald-100
      border: "#6ee7b7", // Emerald-300
    },
    Trial: {
      color: "#eab308", // Yellow-500 - matches bar chart (more distinct from orange)
      background: "#fef3c7", // Amber-100
      border: "#fcd34d", // Amber-300
    },
    Assess: {
      color: "#f97316", // Orange-500 - matches bar chart
      background: "#fed7aa", // Orange-200
      border: "#fdba74", // Orange-300
    },
    Hold: {
      color: "#6b7280", // Gray-500 - matches bar chart
      background: "#f3f4f6", // Gray-100
      border: "#d1d5db", // Gray-300
    },
  },
}

// Cache management
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY = "radar_data_cache"

const getCachedData = (url: string): any | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsedCache: RadarDataCache = JSON.parse(cached)
      const isValid = parsedCache.url === url && Date.now() - parsedCache.timestamp < CACHE_DURATION
      if (isValid) {
        return parsedCache.data
      }
    }
  } catch (error) {
    console.warn("Cache read error:", error)
  }
  return null
}

const setCachedData = (url: string, data: any): void => {
  try {
    const cacheData: RadarDataCache = {
      data,
      timestamp: Date.now(),
      url,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.warn("Cache write error:", error)
  }
}

// Memoized tooltip component
const Tooltip = memo(({ tooltip }: { tooltip: TooltipState }) => {
  if (!tooltip.visible || !tooltip.content) return null

  return (
    <div
      className="fixed z-50 text-white p-3 rounded-lg shadow-xl max-w-xs pointer-events-none transition-opacity duration-200 ease-in-out"
      style={{
        backgroundColor: "#262626",
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="font-semibold text-sm mb-1">{tooltip.content.name}</div>
      <div className="text-xs text-gray-300 leading-relaxed">{tooltip.content.rationale}</div>
    </div>
  )
})

Tooltip.displayName = "Tooltip"

// Memoized technology dropdown component
const TechDropdown = memo(
  ({
    processedData,
    selectedItem,
    onTechSelect,
  }: {
    processedData: RadarItem[]
    selectedItem: RadarItem | null
    onTechSelect: (item: RadarItem) => void
  }) => {
    const handleValueChange = (value: string) => {
      const techId = parseInt(value)
      const tech = processedData.find(item => item.id === techId)
      if (tech) {
        onTechSelect(tech)
      }
    }

    return (
      <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
        <h3 className="text-lg font-semibold mb-4 text-white">Technologies</h3>
        <Select value={selectedItem?.id.toString() || ""} onValueChange={handleValueChange}>
          <SelectTrigger className="w-full bg-black border-neutral-600 text-white hover:border-neutral-500 data-[state=open]:text-white">
            <SelectValue placeholder="Choose a technology..." className="text-white" />
          </SelectTrigger>
          <SelectContent className="bg-black border-neutral-600 text-white max-h-60">
            {processedData.map((tech) => (
              <SelectItem 
                key={tech.id} 
                value={tech.id.toString()}
                className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 data-[highlighted]:bg-neutral-800 text-white hover:text-white focus:text-white data-[highlighted]:text-white"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="truncate mr-2 text-white">{tech.name}</span>
                  <Badge 
                    variant="outline" 
                    className="text-xs shrink-0"
                    style={{
                      color: ENHANCED_COLORS.rings[tech.ring as keyof typeof ENHANCED_COLORS.rings]?.color || "#6b7280",
                      borderColor: ENHANCED_COLORS.rings[tech.ring as keyof typeof ENHANCED_COLORS.rings]?.color || "#6b7280",
                    }}
                  >
                    {tech.ring}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  },
)

TechDropdown.displayName = "TechDropdown"

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
        <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
          <h3 className="text-lg font-semibold mb-4 text-white">Selected Technology</h3>
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-lg text-white">{selectedItem.name}</h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  style={{
                    color: quadrantColors?.primary,
                    borderColor: quadrantColors?.primary,
                  }}
                >
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
            {selectedItem.source_url && (
              <div>
                <h4 className="font-semibold text-sm text-gray-300 mb-2">Source</h4>
                <a
                  href={selectedItem.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  View original source →
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full mt-8 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
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

const RadarChart: React.FC<TechRadarProps> = ({ radarData: propRadarData, isLoading = false }) => {
  const [radarData, setRadarData] = useState<any>(propRadarData)
  const [loading, setLoading] = useState(isLoading)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<RadarItem | null>(null)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  })

  // Responsive configuration
  const getResponsiveConfig = useCallback(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768

    return {
      size: 600, // Increased from 500 to 600
      dotSize: isMobile ? 6 : 10, // Increased from 4/6 to 6/10
      hoveredDotSize: isMobile ? 8 : 14, // Increased from 6/8 to 8/14
      fontSize: isMobile ? "text-sm" : "text-lg",
    }
  }, [])

  const config = getResponsiveConfig()
  const center = config.size / 2
  const maxRadius = center - 40 // Reduced margin to allow bigger rings

  // Simplified ring configuration - support both Adopt/ADOPT formats with bigger rings
  const rings = useMemo(
    () => [
      {
        name: "Adopt",
        altName: "ADOPT", 
        radius: maxRadius * 0.25,
      },
      {
        name: "Trial",
        altName: "TRIAL",
        radius: maxRadius * 0.45,
      },
      {
        name: "Assess", 
        altName: "ASSESS",
        radius: maxRadius * 0.7,
      },
      {
        name: "Hold",
        altName: "HOLD",
        radius: maxRadius * 0.95,
      },
    ],
    [maxRadius],
  )

  // Function to calculate color with alpha transparency based on ring - Handle both ADOPT and Adopt
  const getColorByRing = useCallback((quadrantColor: string, ring: string): string => {
    const alphaMap: { [key: string]: number } = {
      Adopt: 0.9, // 90% opacity
      ADOPT: 0.9,
      Trial: 0.7, // 70% opacity
      TRIAL: 0.7,
      Assess: 0.5, // 50% opacity
      ASSESS: 0.5,
      Hold: 0.3, // 30% opacity
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

  // Enhanced quadrant configuration with key mapping for data compatibility
  const quadrants = useMemo(
    () => [
      { 
        name: "Techniques", 
        key: "techniques",
        startAngle: 180, 
        endAngle: 270, 
        ...ENHANCED_COLORS.quadrants.Techniques 
      },
      { 
        name: "Tools", 
        key: "tools",
        startAngle: 270, 
        endAngle: 360, 
        ...ENHANCED_COLORS.quadrants.Tools 
      },
      { 
        name: "Platforms", 
        key: "platforms",
        startAngle: 90, 
        endAngle: 180, 
        ...ENHANCED_COLORS.quadrants.Platforms 
      },
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

  // Optimized position calculation with seeded randomization
  const calculatePosition = useCallback(
    (item: any, itemsInSameRingQuadrant: any[]): { x: number; y: number } => {
      const quadrant = quadrants.find((q) => q.name === item.quadrant || q.key === item.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", ""))
      const ring = rings.find((r) => r.name === item.ring || r.altName === item.ring)
      if (!quadrant || !ring) return { x: center, y: center }

      // Create consistent but pseudo-random values based on item name
      const seed = item.name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      const random1 = Math.sin(seed * 0.1) * 0.5 + 0.5
      const random2 = Math.sin(seed * 0.2) * 0.5 + 0.5
      const random3 = Math.sin(seed * 0.3) * 0.5 + 0.5

      // Get item position in this section for base distribution
      const itemIndex = itemsInSameRingQuadrant.findIndex((i) => i.name === item.name)
      const totalItems = itemsInSameRingQuadrant.length

      // Convert angles to radians
      const startAngleRad = (quadrant.startAngle * Math.PI) / 180
      const endAngleRad = (quadrant.endAngle * Math.PI) / 180
      
      let angleRange = endAngleRad - startAngleRad
      if (angleRange <= 0) angleRange += 2 * Math.PI

      // Base angular position with some controlled randomness
      const usableAngleRange = angleRange * 0.7
      const angleMargin = angleRange * 0.15
      
      let angle
      if (totalItems === 1) {
        // Single item: place with random offset from center
        angle = startAngleRad + angleRange * 0.5 + (random1 - 0.5) * angleRange * 0.3
      } else {
        // Multiple items: distributed base + randomness
        const baseAngleStep = usableAngleRange / totalItems
        const baseAngle = startAngleRad + angleMargin + (itemIndex + 0.5) * baseAngleStep
        const randomOffset = (random1 - 0.5) * baseAngleStep * 0.6
        angle = baseAngle + randomOffset
      }

      // IMPROVED RADIUS DISTRIBUTION - This is what you want to adjust
      const minRadius = ring === rings[0] ? 25 : rings[rings.indexOf(ring) - 1].radius + 15 // Reduced margins
      const maxRadius = ring.radius - 15 // Reduced margins
      const radiusRange = maxRadius - minRadius
      
      // Use MORE of the available radius space - spread items better vertically
      const baseRadius = minRadius + radiusRange * 0.1 + radiusRange * 0.7 * random2 // Increased from 0.4 to 0.7
      const radiusJitter = radiusRange * 0.3 * (random3 - 0.5) // Increased from 0.2 to 0.3
      const radius = Math.max(minRadius + 3, Math.min(maxRadius - 3, baseRadius + radiusJitter))

      // Calculate base position
      const baseX = center + radius * Math.cos(angle)
      const baseY = center + radius * Math.sin(angle)

      // Add small positional jitter to break perfect circles
      const jitterAmount = 8
      const x = baseX + (random2 - 0.5) * jitterAmount
      const y = baseY + (random3 - 0.5) * jitterAmount

      return { x, y }
    },
    [quadrants, rings, center],
  )

  const processedData = useMemo((): RadarItem[] => {
    if (!radarData?.radar_data) return []

    return radarData.radar_data.map((item: any, globalIndex: number) => {
      const itemsInSameRingQuadrant = radarData.radar_data.filter(
        (other: any) => other.ring === item.ring && other.quadrant === item.quadrant,
      )

      const position = calculatePosition(item, itemsInSameRingQuadrant)
      const quadrant = quadrants.find((q) => q.key === item.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", "") || q.name === item.quadrant)

      // Use alpha transparency based on ring position
      const baseColor = quadrant?.primary || "#666"
      const gradientColor = getColorByRing(baseColor, item.ring)
      const strokeColor = quadrant?.primary || "#666" // This will be 100% opacity

      return {
        ...item,
        x: position.x,
        y: position.y,
        color: gradientColor,
        strokeColor: strokeColor,
        id: globalIndex,
      }
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

  const handleTechSelect = useCallback((item: RadarItem) => {
    setSelectedItem(item)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setSelectedItem(null)
  }, [])

  // Update radar data when props change
  useEffect(() => {
    if (propRadarData) {
      setRadarData(propRadarData)
      setLoading(false)
      setError(null)
    } else if (isLoading) {
      setLoading(true)
      setError(null)
    }
  }, [propRadarData, isLoading])

  // Enhanced data loading with caching - only if no propRadarData provided
  useEffect(() => {
    if (propRadarData) return // Don't load from file if data is provided via props

    const loadRadarData = async () => {
      const dataUrl = "/data/radar_output.json"

      try {
        setLoading(true)

        // Check cache first
        const cachedData = getCachedData(dataUrl)
        if (cachedData) {
          setRadarData(cachedData)
          setError(null)
          setLoading(false)
          return
        }

        // Fetch from network
        const response = await fetch(dataUrl)
        if (!response.ok) {
          throw new Error(`Failed to load radar data: ${response.statusText}`)
        }

        const data = await response.json()

        // Cache the data
        setCachedData(dataUrl, data)

        setRadarData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load radar data")
        console.error("Error loading radar data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadRadarData()
  }, [propRadarData])

  // Loading state with better animation
  if (loading) {
    return (
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[675px]">
          <div className="lg:col-span-2">
            <div className="p-6 bg-black rounded-lg h-full flex flex-col border border-neutral-700">
              <div className="relative flex justify-center items-center flex-1">
                <div className="w-[600px] h-[600px] flex-shrink-0 flex items-center justify-center">
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

  // Enhanced error state
  if (error || !radarData) {
    return (
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[675px]">
          <div className="lg:col-span-2">
            <div className="p-6 bg-black rounded-lg h-full flex flex-col border border-neutral-700">
              <div className="relative flex justify-center items-center flex-1">
                <div className="w-[600px] h-[600px] flex-shrink-0 flex items-center justify-center">
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

  return (
    <div className="w-full mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Radar Chart */}
        <div className="lg:col-span-2 h-[700px]">
          <div className="p-6 bg-black rounded-lg h-full flex flex-col border border-neutral-700">
            {radarData && radarData.topic && (
              <div className="text-left mb-1 flex-shrink-0">
                <h2 className="text-lg font-bold text-white mb-3">{radarData.topic} Tech Radar</h2>
                <p className="text-sm text-gray-300">
                  {processedData.length} Technologies • {radarData.research_metadata?.sources_analyzed || 0} Sources
                </p>
              </div>
            )}
            <div className="relative flex justify-center items-center flex-1">
              <div className="w-[600px] h-[600px] flex-shrink-0">
                <svg
                  width="600"
                  height="600"
                  viewBox="0 0 600 600"
                  className="w-full h-full"
                  style={{ backgroundColor: "#000000" }}
                >
                  {/* Simplified grid circles for rings */}
                  {rings.map((ring) => (
                    <circle
                      key={ring.name}
                      cx={300}
                      cy={300}
                      r={ring.radius}
                      fill="none"
                      stroke="#4b5563"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  ))}

                  {/* Enhanced grid lines for quadrants */}
                  <line x1={300} y1="0" x2={300} y2={600} stroke="#4b5563" strokeWidth="2" opacity="0.8" />
                  <line x1="0" y1={300} x2={600} y2={300} stroke="#4b5563" strokeWidth="2" opacity="0.8" />

                  {/* Enhanced quadrant labels */}
                  {quadrants.map((quadrant, index) => {
                    const positions = [
                      { x: 150, y: 35 }, // Techniques
                      { x: 450, y: 35 }, // Tools
                      { x: 150, y: 575 }, // Platforms
                      { x: 450, y: 575 }, // Languages & Frameworks
                    ]

                    return (
                      <text
                        key={quadrant.name}
                        x={positions[index].x}
                        y={positions[index].y}
                        textAnchor="middle"
                        className="text-sm font-bold transition-all duration-300"
                        fill={quadrant.primary}
                      >
                        {quadrant.name}
                      </text>
                    )
                  })}

                  {/* Ring labels positioned between ring separations - Right side */}
                  <text
                    x={300 + (rings[0].radius / 2)}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[0].name}
                  </text>
                  <text
                    x={300 + (rings[0].radius + rings[1].radius) / 2}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[1].name}
                  </text>
                  <text
                    x={300 + (rings[1].radius + rings[2].radius) / 2}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[2].name}
                  </text>
                  <text
                    x={300 + (rings[2].radius + rings[3].radius) / 2}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[3].name}
                  </text>

                  {/* Ring labels positioned between ring separations - Left side */}
                  <text
                    x={300 - (rings[0].radius / 2)}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[0].name}
                  </text>
                  <text
                    x={300 - (rings[0].radius + rings[1].radius) / 2}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[1].name}
                  </text>
                  <text
                    x={300 - (rings[1].radius + rings[2].radius) / 2}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[2].name}
                  </text>
                  <text
                    x={300 - (rings[2].radius + rings[3].radius) / 2}
                    y={295}
                    textAnchor="middle"
                    className="text-sm font-bold transition-all duration-300"
                    fill="#9ca3af"
                  >
                    {rings[3].name}
                  </text>

                  {/* Enhanced data points with animations */}
                  {processedData.map((item) => {
                    const isHovered = hoveredItem === item.id
                    const isSelected = selectedItem?.id === item.id
                    const opacity = selectedItem && selectedItem.id !== item.id ? 0.4 : 1

                    return (
                      <g key={item.id}>
                        {/* Glow effect for hovered/selected items */}
                        {(isHovered || isSelected) && (
                          <circle
                            cx={item.x}
                            cy={item.y}
                            r={config.hoveredDotSize + 4}
                            fill={item.color}
                            opacity="0.2"
                            className="animate-pulse"
                          />
                        )}

                        {/* Main dot */}
                        <circle
                          cx={item.x}
                          cy={item.y}
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
                          x={item.x}
                          y={item.y + 1}
                          fontSize="8"
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

                {/* Enhanced tooltip */}
                <Tooltip tooltip={tooltip} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="h-[700px] overflow-y-auto">
          <div className="space-y-4 h-full flex flex-col">
            {/* Technology Dropdown */}
            <TechDropdown 
              processedData={processedData}
              selectedItem={selectedItem}
              onTechSelect={handleTechSelect}
            />
            
            {selectedItem && (
              <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
                <h4 className="text-base font-medium mb-3 text-gray-200">Selected Technology</h4>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-white">{selectedItem.name}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        style={{
                          color: ENHANCED_COLORS.quadrants[selectedItem.quadrant as keyof typeof ENHANCED_COLORS.quadrants]?.primary,
                          borderColor: ENHANCED_COLORS.quadrants[selectedItem.quadrant as keyof typeof ENHANCED_COLORS.quadrants]?.primary,
                        }}
                      >
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
                  {selectedItem.source_url && !selectedItem.source_url.includes('search-result-') && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-300 mb-2">Source</h4>
                      <a
                        href={selectedItem.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
                      >
                        View original source →
                      </a>
                    </div>
                  )}
                  <Button
                    onClick={handleCloseSidebar}
                    variant="outline"
                    size="sm"
                    className="w-full mt-6 border-neutral-600 hover:border-neutral-500 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
            
            {/* How to use section - only show when no tech is selected */}
            {!selectedItem && (
              <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
                <h3 className="text-lg font-semibold mb-4 text-white">How to use</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Click on any technology dot or select from the dropdown above to see detailed information. Hover for quick details.
                </p>
              </div>
            )}

            {/* Ring meanings - only show when no tech is selected */}
            {!selectedItem && (
              <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-shrink-0">
                <h3 className="text-lg font-semibold mb-4 text-white">Ring Meanings</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-gray-100">Adopt:</strong>{" "}
                    <span className="text-gray-300">Proven and mature, ready for widespread use</span>
                  </div>
                  <div>
                    <strong className="text-gray-100">Trial:</strong>{" "}
                    <span className="text-gray-300">Worth pursuing with caution, gaining traction</span>
                  </div>
                  <div>
                    <strong className="text-gray-100">Assess:</strong>{" "}
                    <span className="text-gray-300">Worth exploring and understanding the implications</span>
                  </div>
                  <div>
                    <strong className="text-gray-100">Hold:</strong>{" "}
                    <span className="text-gray-300">Proceed with caution or avoid</span>
                  </div>
                </div>
              </div>
            )}

            {/* Research Overview - only show when no tech is selected */}
            {!selectedItem && radarData?.research_metadata && (
              <div className="p-4 bg-black rounded-lg border border-neutral-700 flex-1 min-h-0 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4 text-white">Research Overview</h3>
                <div className="space-y-3 text-sm text-white">
                  <div className="flex justify-between">
                    <span className="text-gray-300 font-bold">Date:</span>
                    <span className="font-medium">{radarData.generated_date || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 font-bold">Reflection Loops:</span>
                    <span className="font-medium">{radarData.research_metadata.research_loops || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 font-bold">Sources Analyzed:</span>
                    <span className="font-medium">{radarData.research_metadata.sources_analyzed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 font-bold">Completion Rate:</span>
                    <span className="font-medium">{radarData.research_metadata.completion_rate || 0}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarChart
export { RadarChart as TechRadarV8 }
