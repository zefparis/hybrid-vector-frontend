import { create } from 'zustand'
import type { EnrollResponse, CheckpointResponse } from '@/services/edguardApi'

interface EdguardState {
  // Enrollment
  studentId: string
  institutionId: string
  officialPhotoB64: string | null
  selfieB64: string | null
  officialDescriptor: Float32Array | null
  selfieDescriptor: Float32Array | null
  enrollmentResult: EnrollResponse | null

  // Session
  sessionId: string
  sessionActive: boolean
  sessionStartTime: number | null
  checkpointNumber: number
  checkpoints: CheckpointResponse[]
  currentStatus: 'CLEAR' | 'WARNING' | 'ALERT' | 'IDLE'
}

interface EdguardActions {
  setStudentInfo: (id: string, instId: string) => void
  setOfficialPhoto: (b64: string) => void
  setSelfie: (b64: string) => void
  setOfficialDescriptor: (d: Float32Array | null) => void
  setSelfieDescriptor: (d: Float32Array | null) => void
  setEnrollmentResult: (r: EnrollResponse) => void
  startSession: () => void
  addCheckpoint: (c: CheckpointResponse) => void
  endSession: () => void
  reset: () => void
}

const initialState: EdguardState = {
  studentId: '',
  institutionId: (import.meta.env.VITE_INSTITUTION_ID as string) ?? '',
  officialPhotoB64: null,
  selfieB64: null,
  officialDescriptor: null,
  selfieDescriptor: null,
  enrollmentResult: null,
  sessionId: '',
  sessionActive: false,
  sessionStartTime: null,
  checkpointNumber: 0,
  checkpoints: [],
  currentStatus: 'IDLE',
}

export const useEdguardStore = create<EdguardState & EdguardActions>((set) => ({
  ...initialState,

  setStudentInfo: (id, instId) => set({ studentId: id, institutionId: instId }),

  setOfficialPhoto: (b64) => set({ officialPhotoB64: b64 }),

  setSelfie: (b64) => set({ selfieB64: b64 }),

  setOfficialDescriptor: (d) => set({ officialDescriptor: d }),

  setSelfieDescriptor: (d) => set({ selfieDescriptor: d }),

  setEnrollmentResult: (r) => set({ enrollmentResult: r }),

  startSession: () =>
    set({
      sessionId: crypto.randomUUID(),
      sessionActive: true,
      sessionStartTime: Date.now(),
      checkpointNumber: 0,
      checkpoints: [],
      currentStatus: 'IDLE',
    }),

  addCheckpoint: (c) =>
    set((state) => ({
      checkpoints: [...state.checkpoints, c],
      checkpointNumber: state.checkpointNumber + 1,
      currentStatus: c.alert_level,
    })),

  endSession: () =>
    set({
      sessionActive: false,
    }),

  reset: () => set({ ...initialState }),
}))
