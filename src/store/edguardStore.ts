import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { EnrollResponse, CheckpointResponse } from '@/services/edguardApi'

type EdguardRole = 'STUDENT' | 'TEACHER' | 'BENEFICIARY'

interface EdguardState {
  // Personal info
  firstName: string
  lastName: string
  email: string
  role: EdguardRole

  // Enrollment
  studentId: string
  institutionId: string
  selfieB64: string | null
  selfieDescriptor: Float32Array | null
  enrollmentResult: EnrollResponse | null

  // Cognitive metrics (set during analysis)
  cognitiveScore: number
  stroopAccuracy: number
  reflexVelocity: number

  // Session
  sessionId: string
  sessionActive: boolean
  sessionStartTime: number | null
  checkpointNumber: number
  checkpoints: CheckpointResponse[]
  currentStatus: 'CLEAR' | 'WARNING' | 'ALERT' | 'IDLE'
}

interface EdguardActions {
  setPersonalInfo: (firstName: string, lastName: string, email: string, role: EdguardRole) => void
  setStudentInfo: (id: string, instId: string) => void
  setSelfie: (b64: string) => void
  setEnrollmentMetrics: (cognitiveScore: number, stroopAccuracy: number, reflexVelocity: number) => void
  setSelfieDescriptor: (d: Float32Array | null) => void
  setEnrollmentResult: (r: EnrollResponse) => void
  startSession: () => void
  addCheckpoint: (c: CheckpointResponse) => void
  endSession: () => void
  reset: () => void
}

const initialState: EdguardState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'STUDENT',
  studentId: '',
  institutionId: (import.meta.env.VITE_INSTITUTION_ID as string) ?? '',
  selfieB64: null,
  selfieDescriptor: null,
  enrollmentResult: null,
  cognitiveScore: 0,
  stroopAccuracy: 0,
  reflexVelocity: 0,
  sessionId: '',
  sessionActive: false,
  sessionStartTime: null,
  checkpointNumber: 0,
  checkpoints: [],
  currentStatus: 'IDLE',
}

const PERSIST_KEY = 'edguard-store-v1'

export const useEdguardStore = create<EdguardState & EdguardActions>()(
  persist(
    (set) => ({
      ...initialState,

      setPersonalInfo: (firstName, lastName, email, role) =>
        set({ firstName, lastName, email, role }),

      setStudentInfo: (id, instId) => set({ studentId: id, institutionId: instId }),

      setSelfie: (b64) => set({ selfieB64: b64 }),

      setEnrollmentMetrics: (cognitiveScore, stroopAccuracy, reflexVelocity) =>
        set({ cognitiveScore, stroopAccuracy, reflexVelocity }),

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
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
        role: state.role,
        studentId: state.studentId,
        institutionId: state.institutionId,
        selfieB64: state.selfieB64,
        enrollmentResult: state.enrollmentResult,
        cognitiveScore: state.cognitiveScore,
        stroopAccuracy: state.stroopAccuracy,
        reflexVelocity: state.reflexVelocity,
        sessionId: state.sessionId,
        sessionActive: state.sessionActive,
        sessionStartTime: state.sessionStartTime,
        checkpointNumber: state.checkpointNumber,
        checkpoints: state.checkpoints,
        currentStatus: state.currentStatus,
      }),
    },
  ),
)
