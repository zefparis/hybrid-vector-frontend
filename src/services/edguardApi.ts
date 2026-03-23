import axios from 'axios'
import { config } from '@/config/api'

const API_URL = config.apiUrl
const API_KEY = config.apiKey

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
})

export interface EnrollRequest {
  selfie_b64: string
  first_name: string
  last_name: string
  email?: string
  tenant_id: string
}

export interface EnrollResponse {
  success: boolean
  student_id: string
  confidence: number
  faceId?: string
  enrolled_at?: string
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
      student_id: '',
      confidence: 0,
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

export async function lookupStudent(payload: {
  first_name: string
  last_name: string
  tenant_id: string
}): Promise<{
  found: boolean
  student_id?: string
  first_name?: string
}> {
  try {
    const { data } = await client.post('/edguard/lookup', payload)
    return data
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as {
        found: boolean
        student_id?: string
        first_name?: string
      }
    }
    return {
      found: false,
    }
  }
}

export async function verifyStudent(payload: {
  selfie_b64: string
  first_name: string
  last_name: string
  tenant_id: string
}): Promise<{
  verified: boolean
  similarity: number
  student_id: string
  first_name: string
}> {
  const { data } = await client.post('/edguard/verify', payload)
  return data
}