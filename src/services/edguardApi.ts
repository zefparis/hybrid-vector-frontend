import axios from 'axios'

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

export interface EnrollRequest {
  student_id: string
  institution_id: string
  official_photo_b64: string
  selfie_b64: string
  cognitive_baseline?: {
    stroop_score: number
    reaction_time_ms: number
    nback_score: number
  }
}

export interface EnrollResponse {
  success: boolean
  student_id: string
  institution_id: string
  enrolled: boolean
  identity_confidence: number
  embedding_dims: number
  enrolled_at: string
  error?: string
  message?: string
}

export interface CheckpointRequest {
  student_id: string
  checkpoint_number: number
  face_b64: string
  cognitive_score?: number
  session_id: string
}

export interface CheckpointResponse {
  success: boolean
  session_id: string
  student_id: string
  checkpoint_number: number
  trust_score: number
  alert_level: 'CLEAR' | 'WARNING' | 'ALERT'
  verified: boolean
  liveness: boolean
  cognitive_deviation: number
  flags: string[]
  timestamp: string
  error?: string
}

export async function enrollStudent(payload: EnrollRequest): Promise<EnrollResponse> {
  try {
    const { data } = await client.post<EnrollResponse>('/edguard/enroll', payload)
    return data
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as EnrollResponse
    }
    return {
      success: false,
      student_id: payload.student_id,
      institution_id: payload.institution_id,
      enrolled: false,
      identity_confidence: 0,
      embedding_dims: 0,
      enrolled_at: '',
      error: 'NETWORK_ERROR',
      message: 'Service indisponible. Réessayez.',
    }
  }
}

export async function sessionCheckpoint(payload: CheckpointRequest): Promise<CheckpointResponse> {
  try {
    const { data } = await client.post<CheckpointResponse>('/edguard/session/checkpoint', payload)
    return data
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as CheckpointResponse
    }
    return {
      success: false,
      session_id: payload.session_id,
      student_id: payload.student_id,
      checkpoint_number: payload.checkpoint_number,
      trust_score: 0,
      alert_level: 'ALERT',
      verified: false,
      liveness: false,
      cognitive_deviation: 0,
      flags: ['NETWORK_ERROR'],
      timestamp: new Date().toISOString(),
      error: 'NETWORK_ERROR',
    }
  }
}
