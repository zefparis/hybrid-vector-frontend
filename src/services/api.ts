import axios from 'axios'
import type { AnalyzePayload, SessionResult } from '@/types'

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

export async function analyzeSession(payload: AnalyzePayload): Promise<SessionResult> {
  const { data } = await client.post<SessionResult>('/auth/session', payload)
  return data
}

export function generateMockResult(cognitiveScore?: number): SessionResult {
  const cognitive = cognitiveScore ?? 60 + Math.random() * 35
  const facialLiveness = 72 + Math.random() * 28
  const facialConfidence = 68 + Math.random() * 30
  const behavioralBonus = 5 + Math.random() * 18

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
