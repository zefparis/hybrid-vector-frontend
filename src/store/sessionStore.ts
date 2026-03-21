import { create } from 'zustand'
import type { SessionResult, ScanPhase, VocalImportData, ReflexResult } from '@/types'

interface SessionState {
  phase: ScanPhase
  currentSession: SessionResult | null
  sessionHistory: SessionResult[]
  isAnalyzing: boolean
  faceImageB64: string | null
  faceDescriptor: Float32Array | null
  faceConfidence: number
  vocalData: VocalImportData | null
  reflexResult: ReflexResult | null
  error: string | null
}

interface SessionActions {
  setPhase: (phase: ScanPhase) => void
  startAnalysis: () => void
  setResult: (result: SessionResult) => void
  setFaceImage: (b64: string) => void
  setFaceDetection: (descriptor: Float32Array | null, confidence: number) => void
  setVocalData: (data: VocalImportData) => void
  setReflexResult: (result: ReflexResult) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: SessionState = {
  phase: 'idle',
  currentSession: null,
  sessionHistory: [],
  isAnalyzing: false,
  faceImageB64: null,
  faceDescriptor: null,
  faceConfidence: 0,
  vocalData: null,
  reflexResult: null,
  error: null,
}

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  startAnalysis: () => set({ isAnalyzing: true, error: null }),

  setResult: (result) =>
    set((state) => ({
      currentSession: result,
      sessionHistory: [result, ...state.sessionHistory],
      isAnalyzing: false,
      phase: 'result' as ScanPhase,
    })),

  setFaceImage: (b64) => set({ faceImageB64: b64 }),

  setFaceDetection: (descriptor, confidence) => set({ faceDescriptor: descriptor, faceConfidence: confidence }),

  setVocalData: (data) => set({ vocalData: data }),

  setReflexResult: (result) => set({ reflexResult: result }),

  setError: (error) => set({ error, isAnalyzing: false }),

  reset: () =>
    set((state) => ({
      ...initialState,
      sessionHistory: state.sessionHistory,
    })),
}))
