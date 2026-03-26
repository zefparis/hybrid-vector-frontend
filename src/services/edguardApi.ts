// VITRINE-ONLY: aucune communication backend depuis hybrid-vector-frontend.
// Les flows EdGuard (enroll/verify/session) sont désormais délégués au Guard externe.
// On garde ce module comme stub typé pour ne pas casser l'UI lors du build.

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

function nowIso(): string {
  return new Date().toISOString()
}

function pseudoRandomFromSeed(seed: string): number {
  // Simple hash -> [0, 1)
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 2 ** 32
}

export async function enrollStudent(payload: EnrollRequest): Promise<EnrollResponse> {
  // Simule un résultat sans backend.
  const r = pseudoRandomFromSeed(`${payload.first_name}-${payload.last_name}-${payload.tenant_id}`)
  const confidence = Math.round(70 + r * 28)
  return {
    success: true,
    student_id: `demo-${Math.floor(r * 10_000)}`,
    confidence,
    faceId: crypto.randomUUID().slice(0, 12),
    enrolled_at: nowIso(),
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
  const r = pseudoRandomFromSeed(`${payload.first_name}-${payload.last_name}-${payload.tenant_id}`)
  const similarity = Math.round(65 + r * 34)
  return {
    verified: similarity >= 72,
    similarity,
    student_id: `demo-${Math.floor(r * 10_000)}`,
    first_name: payload.first_name,
  }
}

export async function sessionCheckpoint(payload: CheckpointRequest): Promise<CheckpointResponse> {
  const r = pseudoRandomFromSeed(`${payload.student_id}-${payload.session_id}-${payload.checkpoint_number}`)
  const trust = Math.round(55 + r * 44)
  const alert_level: CheckpointResponse['alert_level'] = trust >= 75 ? 'CLEAR' : trust >= 62 ? 'WARNING' : 'ALERT'
  return {
    success: true,
    session_id: payload.session_id,
    student_id: payload.student_id,
    checkpoint_number: payload.checkpoint_number,
    trust_score: trust,
    alert_level,
    verified: alert_level !== 'ALERT',
    liveness: true,
    cognitive_deviation: 0,
    flags: alert_level === 'ALERT' ? ['OFFLINE_VITRINE_MODE'] : [],
    timestamp: nowIso(),
  }
}

export async function lookupStudent(_payload: {
  first_name: string
  last_name: string
  tenant_id: string
}): Promise<{
  found: boolean
  student_id?: string
  first_name?: string
}> {
  return { found: false }
}
