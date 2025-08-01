// Advanced zero-overlap positioning algorithm for tech radar
import type { TechnologyPosition } from './radar-data'

interface Position {
  x: number;
  y: number;
}

interface TechWithPosition {
  tech: any;
  x: number;
  y: number;
  radius: number;
  quadrant: string;
  ring: string;
}

export function calculateTechnologyPositions(technologies: any[], config: any): TechnologyPosition[] {
  const positionedTechnologies: TechnologyPosition[] = []
  let idCounter = 1

  // Enhanced quadrant mapping with tighter angle ranges and padding
  const quadrantMap: { [key: string]: { startAngle: number; endAngle: number; sector: number } } = {
    techniques: { startAngle: Math.PI + 0.15, endAngle: 3 * Math.PI / 2 - 0.15, sector: 0 }, // Top-left
    tools: { startAngle: 3 * Math.PI / 2 + 0.15, endAngle: 2 * Math.PI - 0.15, sector: 1 }, // Top-right
    platforms: { startAngle: 0.15, endAngle: Math.PI / 2 - 0.15, sector: 2 }, // Bottom-right
    languagesframeworks: { startAngle: Math.PI / 2 + 0.15, endAngle: Math.PI - 0.15, sector: 3 }, // Bottom-left
  }

  // Group technologies by quadrant and ring
  const grouped = technologies.reduce((acc, tech) => {
    const quadrantKey = tech.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", "")
    const ringKey = tech.ring.toLowerCase()

    if (!acc[quadrantKey]) acc[quadrantKey] = {}
    if (!acc[quadrantKey][ringKey]) acc[quadrantKey][ringKey] = []

    acc[quadrantKey][ringKey].push(tech)
    return acc
  }, {})

  // Collect all positioned technologies to check for overlaps
  const allPositioned: TechWithPosition[] = []

  // Position technologies in each quadrant and ring with smart spacing
  Object.entries(grouped).forEach(([quadrantKey, rings]: [string, any]) => {
    Object.entries(rings).forEach(([ringKey, techs]: [string, any]) => {
      const ringConfig = config.rings.find((r: any) => r.name.toLowerCase() === ringKey)
      if (!ringConfig) return

      const quadrantConfig = quadrantMap[quadrantKey]
      if (!quadrantConfig) return

      // Use grid-based positioning for better distribution
      const techsInRing = techs.length
      const positions = generateGridPositions(ringConfig, quadrantConfig, techsInRing, allPositioned)

      // Position each technology using pre-calculated grid positions
      techs.forEach((tech: any, index: number) => {
        const position = positions[index] || findEmergencyPosition(ringConfig, quadrantConfig, allPositioned)

        const positionedTech: TechWithPosition = {
          tech,
          x: position.x,
          y: position.y,
          radius: 8, // Reduced circle radius to match UI
          quadrant: quadrantKey,
          ring: ringKey
        }

        allPositioned.push(positionedTech)

        positionedTechnologies.push({
          ...tech,
          id: idCounter++,
          x: position.x,
          y: position.y,
        })
      })
    })
  })

  return positionedTechnologies
}

function generateGridPositions(
  ringConfig: any,
  quadrantConfig: any,
  count: number,
  existingPositions: TechWithPosition[]
): Position[] {
  const positions: Position[] = []
  const minRadius = Math.max(60, ringConfig.radius - 45) // More padding from center
  const maxRadius = ringConfig.radius - 30 // More padding from outer edge
  const dotRadius = 8
  const minDistance = dotRadius * 4 // Significantly increased minimum distance
  
  // Calculate available arc length and radial space
  const arcAngle = quadrantConfig.endAngle - quadrantConfig.startAngle
  const radialSpace = maxRadius - minRadius
  
  // Use spiral positioning for better distribution
  const spiralTurns = Math.max(2, Math.ceil(count / 6))
  const angleStep = arcAngle / Math.max(count, 6)
  const radiusStep = radialSpace / spiralTurns
  
  for (let i = 0; i < count; i++) {
    let bestPosition: Position | null = null
    let maxDistance = 0
    
    // Try multiple candidate positions and pick the one with maximum distance from others
    for (let attempt = 0; attempt < 20; attempt++) {
      // Spiral positioning with some randomness
      const spiralProgress = i / count
      const angle = quadrantConfig.startAngle + (spiralProgress * arcAngle) + 
                   (Math.random() - 0.5) * angleStep * 0.8
      const radius = minRadius + (spiralProgress * radialSpace) + 
                    (Math.random() - 0.5) * radiusStep * 0.6
      
      // Ensure we stay within bounds
      const clampedAngle = Math.max(quadrantConfig.startAngle + 0.1, 
                                   Math.min(quadrantConfig.endAngle - 0.1, angle))
      const clampedRadius = Math.max(minRadius + 15, 
                                    Math.min(maxRadius - 15, radius))
      
      const x = Math.cos(clampedAngle) * clampedRadius
      const y = Math.sin(clampedAngle) * clampedRadius
      
      // Calculate minimum distance to existing points
      const distances = [...existingPositions, ...positions].map(existing => 
        Math.sqrt(Math.pow(x - existing.x, 2) + Math.pow(y - existing.y, 2))
      )
      const minDistanceToOthers = distances.length > 0 ? Math.min(...distances) : Infinity
      
      // Only consider positions that don't overlap
      if (minDistanceToOthers >= minDistance && minDistanceToOthers > maxDistance) {
        maxDistance = minDistanceToOthers
        bestPosition = { x, y }
      }
    }
    
    // If we found a good position, use it; otherwise use force-based positioning
    if (bestPosition) {
      positions.push(bestPosition)
    } else {
      const fallbackPosition = findForceBasedPosition(
        ringConfig, quadrantConfig, 
        [...existingPositions, ...positions.map((p, idx) => ({
          tech: { id: `temp_${idx}` },
          x: p.x,
          y: p.y,
          radius: 8,
          quadrant: 'temp',
          ring: 'temp'
        }))], minDistance
      )
      positions.push(fallbackPosition)
    }
  }
  
  return positions
}

function findForceBasedPosition(
  ringConfig: any,
  quadrantConfig: any,
  existingPositions: TechWithPosition[],
  minDistance: number
): Position {
  const midRadius = (ringConfig.radius + Math.max(60, ringConfig.radius - 45)) / 2
  const midAngle = (quadrantConfig.startAngle + quadrantConfig.endAngle) / 2
  
  let x = Math.cos(midAngle) * midRadius
  let y = Math.sin(midAngle) * midRadius
  
  // Apply strong repulsion forces
  const iterations = 50
  const forceStrength = 5
  
  for (let i = 0; i < iterations; i++) {
    let forceX = 0
    let forceY = 0
    
    existingPositions.forEach(existing => {
      const dx = x - existing.x
      const dy = y - existing.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < minDistance * 2 && distance > 0) {
        const force = forceStrength / Math.max(distance, 1)
        forceX += (dx / distance) * force
        forceY += (dy / distance) * force
      }
    })
    
    x += forceX
    y += forceY
    
    // Constrain to ring
    const currentRadius = Math.sqrt(x * x + y * y)
    const minRadius = Math.max(60, ringConfig.radius - 45)
    const maxRadius = ringConfig.radius - 30
    
    if (currentRadius > 0) {
      const targetRadius = Math.max(minRadius, Math.min(maxRadius, currentRadius))
      const scale = targetRadius / currentRadius
      x *= scale
      y *= scale
    }
    
    // Constrain to quadrant
    const currentAngle = Math.atan2(y, x)
    const normalizedAngle = currentAngle < 0 ? currentAngle + 2 * Math.PI : currentAngle
    
    if (normalizedAngle < quadrantConfig.startAngle || normalizedAngle > quadrantConfig.endAngle) {
      const midAngle = (quadrantConfig.startAngle + quadrantConfig.endAngle) / 2
      const currentRadius = Math.sqrt(x * x + y * y)
      x = Math.cos(midAngle) * currentRadius
      y = Math.sin(midAngle) * currentRadius
    }
  }
  
  return { x, y }
}

function findEmergencyPosition(
  ringConfig: any,
  quadrantConfig: any,
  existingPositions: TechWithPosition[]
): Position {
  // Use force-based positioning as last resort
  const midRadius = (ringConfig.radius + Math.max(60, ringConfig.radius - 45)) / 2
  const midAngle = (quadrantConfig.startAngle + quadrantConfig.endAngle) / 2
  
  let x = Math.cos(midAngle) * midRadius
  let y = Math.sin(midAngle) * midRadius
  
  // Apply repulsion forces from existing positions
  const iterations = 30
  const forceStrength = 3
  
  for (let i = 0; i < iterations; i++) {
    let forceX = 0
    let forceY = 0
    
    existingPositions.forEach(existing => {
      const dx = x - existing.x
      const dy = y - existing.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 32 && distance > 0) { // 4 * radius minimum
        const force = forceStrength / Math.max(distance, 1)
        forceX += (dx / distance) * force
        forceY += (dy / distance) * force
      }
    })
    
    x += forceX
    y += forceY
    
    // Constrain to ring
    const currentRadius = Math.sqrt(x * x + y * y)
    const minRadius = Math.max(60, ringConfig.radius - 45)
    const maxRadius = ringConfig.radius - 30
    
    if (currentRadius > 0) {
      const targetRadius = Math.max(minRadius, Math.min(maxRadius, currentRadius))
      const scale = targetRadius / currentRadius
      x *= scale
      y *= scale
    }
  }
  
  return { x, y }
}
