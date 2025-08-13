// Optimized position calculation with seeded random and memoization
import type { TechnologyPosition } from './radar-data'

// Create a seeded random number generator for consistent positioning
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate seed from technology name for consistency
function generateSeed(name: string): number {
  return name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function calculateTechnologyPositions(technologies: any[]): TechnologyPosition[] {
  const positionedTechnologies: TechnologyPosition[] = []
  let idCounter = 1

  // Enhanced quadrant mapping with proper angle ranges
  const quadrantMap: { [key: string]: { startAngle: number; endAngle: number; sector: number } } = {
    techniques: { startAngle: Math.PI + 0.1, endAngle: 3 * Math.PI / 2 - 0.1, sector: 0 }, // Top-left
    tools: { startAngle: 3 * Math.PI / 2 + 0.1, endAngle: 2 * Math.PI - 0.1, sector: 1 }, // Top-right
    platforms: { startAngle: 0.1, endAngle: Math.PI / 2 - 0.1, sector: 2 }, // Bottom-right
    languagesframeworks: { startAngle: Math.PI / 2 + 0.1, endAngle: Math.PI - 0.1, sector: 3 }, // Bottom-left
  }

  // Ring configuration with fixed radius bounds
  const ringMap: { [key: string]: { minRadius: number; maxRadius: number; order: number } } = {
    adopt: { minRadius: 20, maxRadius: 80, order: 0 },
    trial: { minRadius: 90, maxRadius: 150, order: 1 },
    assess: { minRadius: 160, maxRadius: 220, order: 2 },
    hold: { minRadius: 230, maxRadius: 290, order: 3 }
  }

  // Calculate optimized position for each technology
  const calculateOptimizedPosition = (
    tech: any, 
    itemsInSameRingQuadrant: any[], 
    center: number = 300
  ): { x: number; y: number } => {
    const quadrantKey = tech.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", "")
    const ringKey = tech.ring.toLowerCase()

    const quadrantConfig = quadrantMap[quadrantKey]
    const ringConfig = ringMap[ringKey]

    if (!quadrantConfig || !ringConfig) {
      return { x: center, y: center }
    }

    // Create seeded random for consistency
    const seed = generateSeed(tech.name)
    const random1 = seededRandom(seed)
    const random2 = seededRandom(seed + 1)

    // Calculate angle range within quadrant (with padding)
    let angleRange = quadrantConfig.endAngle - quadrantConfig.startAngle
    if (angleRange <= 0) angleRange += 2 * Math.PI

    // Generate angle with 80% of range and 10% padding on each side
    const paddedAngleRange = angleRange * 0.8
    const angle = quadrantConfig.startAngle + (angleRange * 0.1) + (random1 * paddedAngleRange)

    // Generate radius within ring bounds with padding
    const radiusRange = ringConfig.maxRadius - ringConfig.minRadius - 20 // 10px padding each side
    const radius = ringConfig.minRadius + 10 + (random2 * radiusRange)

    // Apply collision avoidance with other items in same ring/quadrant
    let finalRadius = radius
    let finalAngle = angle
    
    // Check for collisions and adjust if needed
    const minDistance = 35 // Minimum distance between centers
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      let hasCollision = false
      const testX = center + finalRadius * Math.cos(finalAngle)
      const testY = center + finalRadius * Math.sin(finalAngle)

      for (const otherTech of itemsInSameRingQuadrant) {
        if (otherTech.name === tech.name) continue
        
        const distance = Math.sqrt(
          Math.pow(testX - otherTech.x, 2) + Math.pow(testY - otherTech.y, 2)
        )
        
        if (distance < minDistance) {
          hasCollision = true
          break
        }
      }

      if (!hasCollision) break

      // Adjust position by adding some variance
      const adjustSeed = seed + attempts + 10
      finalAngle = quadrantConfig.startAngle + (angleRange * 0.1) + 
                  (seededRandom(adjustSeed) * paddedAngleRange)
      finalRadius = ringConfig.minRadius + 10 + 
                   (seededRandom(adjustSeed + 1) * radiusRange)
      attempts++
    }

    // Calculate final position
    const x = center + finalRadius * Math.cos(finalAngle)
    const y = center + finalRadius * Math.sin(finalAngle)

    return { x, y }
  }

  // Position each technology with collision avoidance
  technologies.forEach(tech => {
    const quadrantKey = tech.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", "")
    const ringKey = tech.ring.toLowerCase()
    
    // Get already positioned items in same ring/quadrant for collision avoidance
    const itemsInSameGroup = positionedTechnologies.filter(positioned => {
      const pQuadrantKey = positioned.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", "")
      const pRingKey = positioned.ring.toLowerCase()
      return pQuadrantKey === quadrantKey && pRingKey === ringKey
    })

    const position = calculateOptimizedPosition(tech, itemsInSameGroup, 300)

    positionedTechnologies.push({
      ...tech,
      id: idCounter++,
      x: position.x,
      y: position.y,
    })
  })

  return positionedTechnologies
}
