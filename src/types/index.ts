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
  breakdown?: TrustScoreBreakdown
  reason?: string | null
}

export interface TrustScoreBreakdown {
  facial_liveness: number
  facial_confidence: number
  cognitive_score: number
  behavioral_bonus: number
}

export interface AnalyzePayload {
  tenant_id: string
  user_id: string
  face_image_b64: string
  cognitive_session_id: string
  cognitive_score_override?: number
}

export interface VocalRoundResult {
  round: number
  reactionTimeMs: number
  durationMs: number
  isStroop: boolean
  stroopCorrect?: boolean
}

export interface VocalImportData {
  rounds: VocalRoundResult[]
  avgReactionMs: number
}

export interface ReflexSignal {
  id: string
  angle: number
  distance: number
  type: 'valid' | 'noise' | 'ghost'
  spawnTime: number
}

export interface ReflexResult {
  intercepted: number
  total: number
  avgVelocityMs: number
  falsePositives: number
  accuracy: number
}

export interface CognitiveScoreInput {
  vocalReactionTime: number
  stroopAccuracy: number
  reflexAccuracy: number
  reflexVelocity: number
  sensorVariance: number
  accelerometer?: Array<{ x: number; y: number; z: number }>
  gyroscope?: Array<{ alpha: number; beta: number; gamma: number }>
  touchPressure?: number[]
  tapTimings?: number[]
  mouseHumanScore?: number
}

export type ScanPhase = 'idle' | 'facial' | 'vocal' | 'reflex' | 'analysis' | 'result'
