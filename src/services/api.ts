import axios from 'axios'
import type { AnalyzePayload, SessionResult, CognitiveScoreInput } from '@/types'
import type { MouseBehavior } from '@/hooks/useSensors'

const API_URL = (import.meta.env.VITE_HV_API_URL as string) ?? ''
const API_KEY = (import.meta.env.VITE_HV_API_KEY as string) ?? ''

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
})

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function scoreMouseBehavior(m: MouseBehavior): number {
  // Jitter: humans have jitter 0.3–1.5px stddev; bots ≈ 0
  const jitterScore = clamp01(m.jitterAmplitude > 0.1 ? Math.min(m.jitterAmplitude / 1.5, 1) : 0)

  // Curvilinear: humans > 1.3; bots ≈ 1.0 (straight lines)
  const curveScore = clamp01((m.curvilinearIndex - 1) / 2)

  // Timing variance: humans have variable click intervals; bots are constant
  const timingScore = clamp01(m.reactionVariance / 500)

  // Velocity variance: humans have variable speed; bots are constant
  const velVariance = m.velocitySamples.length > 2
    ? Math.sqrt(
        m.velocitySamples.reduce((s, v) => {
          const mean = m.velocitySamples.reduce((a, b) => a + b, 0) / m.velocitySamples.length
          return s + (v - mean) ** 2
        }, 0) / m.velocitySamples.length,
      )
    : 0
  const velScore = clamp01(velVariance / 800)

  // Click offset: humans don't hit dead center; bots do
  const avgOffset = m.clickOffsets.length > 0
    ? m.clickOffsets.reduce((s, o) => s + Math.sqrt(o.x ** 2 + o.y ** 2), 0) / m.clickOffsets.length
    : 0
  const offsetScore = clamp01(avgOffset / 20)

  // Hover durations: humans hover variably; bots skip or are instant
  const hoverScore = m.hoverDurations.length > 0 ? clamp01(m.hoverDurations.length / 10) : 0

  return clamp01(
    jitterScore * 0.2 +
    curveScore * 0.2 +
    timingScore * 0.2 +
    velScore * 0.15 +
    offsetScore * 0.15 +
    hoverScore * 0.1,
  )
}

export function computeCognitiveScore(input: CognitiveScoreInput): number {
  const reactionNorm = clamp01(1 - input.vocalReactionTime / 2000)
  const reflexNorm = clamp01(1 - input.reflexVelocity / 1500)
  const sensorNorm = clamp01(1 - input.sensorVariance / 50)

  const hasMouse = input.mouseHumanScore != null

  if (hasMouse) {
    // Desktop weights (reduced proportionally to make room for 0.15 mouse)
    const score =
      reactionNorm * 0.17 +
      input.stroopAccuracy * 0.21 +
      input.reflexAccuracy * 0.25 +
      reflexNorm * 0.13 +
      sensorNorm * 0.09 +
      input.mouseHumanScore! * 0.15
    return Math.round(Math.max(0, Math.min(100, score * 100)))
  }

  // Mobile weights (no mouse data)
  const score =
    reactionNorm * 0.2 +
    input.stroopAccuracy * 0.25 +
    input.reflexAccuracy * 0.3 +
    reflexNorm * 0.15 +
    sensorNorm * 0.1

  return Math.round(Math.max(0, Math.min(100, score * 100)))
}

export async function analyzeSession(payload: AnalyzePayload): Promise<SessionResult> {
  const { data } = await client.post<SessionResult>('/auth/session', payload)
  return data
}

export function generateMockResult(cognitiveScore?: number): SessionResult {
  const cognitive = cognitiveScore ?? 60 + Math.random() * 35
  const facialLiveness = 75 + Math.random() * 25
  const facialConfidence = 70 + Math.random() * 28
  const behavioralBonus = 8 + Math.random() * 15

  const trustScore = Math.round(
    facialLiveness * 0.3 + facialConfidence * 0.3 + cognitive * 0.3 + behavioralBonus * 0.1,
  )

  return {
    session_id: crypto.randomUUID(),
    user_id: `demo-${Date.now()}`,
    tenant_id: (import.meta.env.VITE_TENANT_ID as string) ?? 'demo-tenant',
    trust_score: Math.min(100, trustScore),
    is_human: trustScore >= 55,
    confidence_level: trustScore >= 80 ? 'HIGH' : trustScore >= 60 ? 'MEDIUM' : 'LOW',
    facial_liveness: Math.round(facialLiveness),
    facial_confidence: Math.round(facialConfidence),
    cognitive_score: Math.round(cognitive),
    behavioral_bonus: Math.round(behavioralBonus),
    timestamp: new Date().toISOString(),
    processing_time_ms: 1100 + Math.floor(Math.random() * 900),
  }
}
