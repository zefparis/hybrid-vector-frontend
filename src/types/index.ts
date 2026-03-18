export interface SessionResult {
  session_id: string
  user_id: string
  tenant_id: string
  trust_score: number
  is_human: boolean
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW'
  facial_liveness: number
  facial_confidence: number
  cognitive_score: number
  behavioral_bonus: number
  timestamp: string
  processing_time_ms: number
}

export interface AnalyzePayload {
  tenant_id: string
  user_id: string
  face_image_b64: string
  cognitive_session_id: string
}

export interface CognitiveTestResult {
  session_id: string
  score: number
  correct_clicks: number
  total_rounds: number
  avg_reaction_time_ms: number
}

export interface CognitiveRound {
  circles: CognitiveCircle[]
}

export interface CognitiveCircle {
  id: string
  x: number
  y: number
  isGreen: boolean
}
