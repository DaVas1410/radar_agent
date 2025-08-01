export interface RadarTechnology {
  name: string
  description: string
  quadrant: string
  ring: string
  score: number
  rationale: string
  source_url: string
}

export interface RadarData {
  topic: string
  generated_date: string
  generated_time: string
  total_elements: number
  summary_report: string
  research_metadata: {
    research_loops: number
    sources_analyzed: number
    target_elements: number
    completion_rate: number
    average_score: number
  }
  radar_data: RadarTechnology[]
}

export interface TechnologyPosition extends RadarTechnology {
  id: number
  x: number
  y: number
}

export interface RadarConfig {
  quadrants: Array<{
    name: string
    key: string
    color: string
    x: number
    y: number
  }>
  rings: Array<{
    name: string
    radius: number
    color: string
  }>
}
