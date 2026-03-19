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

function computeVariance(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}

function computeMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function magnitude3(x: number, y: number, z: number): number {
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2)
}

function normalizeVarianceScore(values: number[], divisor: number): number {
  return clamp01(values.length > 1 ? computeVariance(values) / divisor : 0)
}

function computeTouchPressureScore(pressures: number[]): number {
  if (pressures.length === 0) return 0

  const meanPressure = computeMean(pressures)
  const variancePressure = normalizeVarianceScore(pressures, 0.08)
  const presenceScore = clamp01(pressures.length / 3)
  const meanScore = clamp01(meanPressure / 0.65)

  return clamp01(meanScore * 0.45 + variancePressure * 0.35 + presenceScore * 0.2)
}

function computeTapTimingScore(tapTimings: number[]): number {
  if (tapTimings.length === 0) return 0

  const varianceScore = normalizeVarianceScore(tapTimings, 200)
  const presenceScore = clamp01(Math.min(tapTimings.length, 5) / 5)

  return clamp01(varianceScore * 0.75 + presenceScore * 0.25)
}

function computeGyroscopeScore(gyroscope: Array<{ alpha: number; beta: number; gamma: number }>): number {
  if (gyroscope.length === 0) return 0

  const headingSeries = gyroscope.map((sample) => sample.alpha)
  const tiltSeries = gyroscope.map((sample) => Math.sqrt(sample.beta ** 2 + sample.gamma ** 2))
  const magnitudeSeries = gyroscope.map((sample) => magnitude3(sample.alpha, sample.beta, sample.gamma))

  const headingScore = normalizeVarianceScore(headingSeries, 1800)
  const tiltScore = normalizeVarianceScore(tiltSeries, 900)
  const magnitudeScore = normalizeVarianceScore(magnitudeSeries, 2200)

  return clamp01(headingScore * 0.35 + tiltScore * 0.4 + magnitudeScore * 0.25)
}

function computeMobileBehaviorScore(input: CognitiveScoreInput): {
  score: number
  accelerometerScore: number
  gyroscopeScore: number
  touchPressureScore: number
  tapTimingScore: number
} {
  const accelerometerScore = input.sensorVariance === 0
    ? 0.3
    : clamp01(input.sensorVariance / 30)
  const gyroscopeScore = computeGyroscopeScore(input.gyroscope ?? [])
  const touchPressureScore = computeTouchPressureScore(input.touchPressure ?? [])
  const tapTimingScore = computeTapTimingScore(input.tapTimings ?? [])

  const available: Array<{ score: number; weight: number }> = []

  if (input.accelerometer && input.accelerometer.length > 0) {
    available.push({ score: accelerometerScore, weight: 0.35 })
  }
  if ((input.gyroscope?.length ?? 0) > 0) {
    available.push({ score: gyroscopeScore, weight: 0.25 })
  }
  if ((input.touchPressure?.length ?? 0) > 0) {
    available.push({ score: touchPressureScore, weight: 0.2 })
  }
  if ((input.tapTimings?.length ?? 0) > 0) {
    available.push({ score: tapTimingScore, weight: 0.2 })
  }

  const totalWeight = available.reduce((sum, entry) => sum + entry.weight, 0)
  const score = totalWeight > 0
    ? available.reduce((sum, entry) => sum + entry.score * entry.weight, 0) / totalWeight
    : 0

  return {
    score: clamp01(score),
    accelerometerScore,
    gyroscopeScore,
    touchPressureScore,
    tapTimingScore,
  }
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
  const vocalScore = clamp01(1 - input.vocalReactionTime / 2000)
  const stroopScore = clamp01(input.stroopAccuracy)
  const reflexScore = clamp01(input.reflexAccuracy)
  const reflexVelocityScore = clamp01(1 - input.reflexVelocity / 1500)
  const mouseScore = input.mouseHumanScore ?? 0

  const tapTimings = input.tapTimings ?? []
  const tapVariance = tapTimings.length > 1 ? computeVariance(tapTimings) : 0
  const tapScore = clamp01(tapVariance / 200)

  let sensorNorm: number
  if (input.sensorVariance === 0) {
    sensorNorm = 0.3
  } else {
    sensorNorm = clamp01(input.sensorVariance / 30)
  }

  const hasMouse = input.mouseHumanScore != null
  const mobileBehavior = computeMobileBehaviorScore(input)
  const behavioralScore = hasMouse ? mouseScore : mobileBehavior.score

  console.log('[SCORE] inputs:', JSON.stringify({
    vocalReactionTime: input.vocalReactionTime,
    stroopAccuracy: input.stroopAccuracy,
    reflexAccuracy: input.reflexAccuracy,
    reflexVelocity: input.reflexVelocity,
    sensorVariance: input.sensorVariance,
    accelerometerSamples: input.accelerometer?.length ?? 0,
    gyroscopeSamples: input.gyroscope?.length ?? 0,
    touchPressureSamples: input.touchPressure?.length ?? 0,
    mouseHumanScore: input.mouseHumanScore,
    tapTimings: input.tapTimings,
  }))
  console.log('[SCORE] weights used:', JSON.stringify(hasMouse ? {
    vocal: 0.17,
    stroop: 0.21,
    reflex: 0.25,
    reflexVelocity: 0.13,
    sensorNorm: 0.09,
    mouse: 0.15,
  } : {
    vocal: 0.19,
    stroop: 0.24,
    reflex: 0.28,
    reflexVelocity: 0.14,
    mobileBehavior: 0.15,
  }))
  console.log('[SCORE] raw scores:', JSON.stringify({
    vocal: vocalScore,
    stroop: stroopScore,
    reflex: reflexScore,
    behavioral: behavioralScore,
    mouse: input.mouseHumanScore,
    tapTimings,
    tapVariance,
    tapScore,
    sensorNorm,
    mobileBehaviorScore: mobileBehavior.score,
    mobileBehaviorBreakdown: {
      accelerometerScore: mobileBehavior.accelerometerScore,
      gyroscopeScore: mobileBehavior.gyroscopeScore,
      touchPressureScore: mobileBehavior.touchPressureScore,
      tapTimingScore: mobileBehavior.tapTimingScore,
    },
  }))

  if (hasMouse) {
    // Desktop weights (reduced proportionally to make room for 0.15 mouse)
    const score =
      vocalScore * 0.17 +
      stroopScore * 0.21 +
      reflexScore * 0.25 +
      reflexVelocityScore * 0.13 +
      sensorNorm * 0.09 +
      mouseScore * 0.15
    const finalScore = Math.round(Math.max(0, Math.min(100, score * 100)))
    console.log('[SCORE] final cognitive_score:', finalScore)
    return finalScore
  }

  // Mobile weights (no mouse data)
  const score =
    vocalScore * 0.19 +
    stroopScore * 0.24 +
    reflexScore * 0.28 +
    reflexVelocityScore * 0.14 +
    mobileBehavior.score * 0.15

  const finalScore = Math.round(Math.max(0, Math.min(100, score * 100)))
  console.log('[SCORE] final cognitive_score:', finalScore)
  return finalScore
}

export async function analyzeSession(payload: AnalyzePayload): Promise<SessionResult> {
  console.log('[API] cognitive_score_override sent:', payload.cognitive_score_override)
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
