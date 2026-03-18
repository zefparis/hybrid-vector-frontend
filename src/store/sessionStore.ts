import { create } from 'zustand'
import type { SessionResult, CognitiveTestResult } from '@/types'

interface SessionState {
  currentSession: SessionResult | null
  sessionHistory: SessionResult[]
  isAnalyzing: boolean
  currentStep: 1 | 2 | 3
  faceImageB64: string | null
  cognitiveResult: CognitiveTestResult | null
  error: string | null
}

interface SessionActions {
  setStep: (step: 1 | 2 | 3) => void
  startAnalysis: () => void
  setResult: (result: SessionResult) => void
  setFaceImage: (b64: string) => void
  setCognitiveResult: (result: CognitiveTestResult) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: SessionState = {
  currentSession: null,
  sessionHistory: [],
  isAnalyzing: false,
  currentStep: 1,
  faceImageB64: null,
  cognitiveResult: null,
  error: null,
}

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  startAnalysis: () => set({ isAnalyzing: true, error: null }),

  setResult: (result) =>
    set((state) => ({
      currentSession: result,
      sessionHistory: [result, ...state.sessionHistory],
      isAnalyzing: false,
    })),

  setFaceImage: (b64) => set({ faceImageB64: b64 }),

  setCognitiveResult: (result) => set({ cognitiveResult: result }),

  setError: (error) => set({ error, isAnalyzing: false }),

  reset: () =>
    set({
      currentSession: null,
      isAnalyzing: false,
      currentStep: 1,
      faceImageB64: null,
      cognitiveResult: null,
      error: null,
    }),
}))
