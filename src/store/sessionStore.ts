import { create } from 'zustand'
import type { SessionResult, ScanPhase, VocalImportData, ReflexResult } from '@/types'

interface SessionState {
  phase: ScanPhase
  currentSession: SessionResult | null
  sessionHistory: SessionResult[]
  isAnalyzing: boolean
  faceImageB64: string | null
  vocalData: VocalImportData | null
  reflexResult: ReflexResult | null
  error: string | null
}

interface SessionActions {
  setPhase: (phase: ScanPhase) => void
  startAnalysis: () => void
  setResult: (result: SessionResult) => void
  setFaceImage: (b64: string) => void
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

  setVocalData: (data) => set({ vocalData: data }),

  setReflexResult: (result) => set({ reflexResult: result }),

  setError: (error) => set({ error, isAnalyzing: false }),

  reset: () =>
    set((state) => ({
      ...initialState,
      sessionHistory: state.sessionHistory,
    })),
}))
