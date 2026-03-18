import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, RotateCcw, AlertCircle } from 'lucide-react'
import { FaceCapture } from '@/components/FaceCapture'
import { CognitiveTest } from '@/components/CognitiveTest'
import { TrustScore } from '@/components/TrustScore'
import { ScoreBreakdown } from '@/components/ScoreBreakdown'
import { StatusBadge } from '@/components/StatusBadge'
import { useSessionStore } from '@/store/sessionStore'
import { analyzeSession, generateMockResult } from '@/services/api'
import type { CognitiveTestResult } from '@/types'
import { useState } from 'react'

const ANALYSIS_MESSAGES = [
  'Scanning facial biometrics...',
  'Running liveness detection...',
  'Evaluating cognitive response...',
  'Computing Hybrid Trust Score...',
]

const steps = [
  { id: 1, label: 'Face Capture' },
  { id: 2, label: 'Cognitive Test' },
  { id: 3, label: 'Analysis' },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300"
              style={{
                borderColor:
                  step.id <= currentStep ? '#00C2FF' : 'rgba(255,255,255,0.1)',
                backgroundColor:
                  step.id < currentStep
                    ? '#00C2FF'
                    : step.id === currentStep
                      ? 'rgba(0,194,255,0.15)'
                      : 'transparent',
                color:
                  step.id < currentStep
                    ? '#0A0F1E'
                    : step.id === currentStep
                      ? '#00C2FF'
                      : 'rgba(255,255,255,0.3)',
                boxShadow: step.id === currentStep ? '0 0 12px rgba(0,194,255,0.4)' : undefined,
              }}
            >
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                color: step.id === currentStep ? '#F9FAFB' : 'rgba(255,255,255,0.35)',
              }}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className="w-16 sm:w-24 h-px mx-2 mb-5 transition-all duration-500"
              style={{
                backgroundColor:
                  step.id < currentStep ? '#00C2FF' : 'rgba(255,255,255,0.08)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function AnalysisLoader({ onDone }: { onDone: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => {
        const next = i + 1
        if (next >= ANALYSIS_MESSAGES.length) {
          clearInterval(interval)
          return i
        }
        return next
      })
    }, 900)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const t = setTimeout(onDone, ANALYSIS_MESSAGES.length * 900 + 400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="relative w-24 h-24">
        <div
          className="absolute inset-0 rounded-full border-2 border-hv-cyan/20 animate-ping-slow"
          style={{ animationDuration: '2s' }}
        />
        <div className="absolute inset-2 rounded-full border-2 border-hv-cyan/30 animate-spin-slow" />
        <div className="absolute inset-4 rounded-full border-2 border-t-hv-cyan border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-hv-cyan animate-pulse" />
        </div>
      </div>

      <div className="space-y-3 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-hv-text font-semibold text-lg"
          >
            {ANALYSIS_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
        <p className="text-hv-muted text-sm">
          Processing biometric data — this may take a moment
        </p>
      </div>

      <div className="flex gap-1.5">
        {ANALYSIS_MESSAGES.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i <= msgIndex ? 24 : 8,
              backgroundColor: i <= msgIndex ? '#00C2FF' : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function Demo() {
  const {
    currentStep,
    faceImageB64,
    cognitiveResult,
    currentSession,
    isAnalyzing,
    error,
    setStep,
    startAnalysis,
    setResult,
    setFaceImage,
    setCognitiveResult,
    setError,
    reset,
  } = useSessionStore()

  const analysisCalledRef = useRef(false)

  const handleCapture = (imageSrc: string) => {
    setFaceImage(imageSrc)
  }

  const handleRetake = () => {
    setFaceImage('')
  }

  const handleCognitiveComplete = (result: CognitiveTestResult) => {
    setCognitiveResult(result)
    setStep(3)
  }

  const handleAnalysisDone = async () => {
    if (analysisCalledRef.current) return
    analysisCalledRef.current = true
    startAnalysis()

    try {
      const tenantId = (import.meta.env.VITE_TENANT_ID as string) || 'demo-tenant'
      const userId = `user-${Date.now()}`
      const sessionId = cognitiveResult?.session_id ?? crypto.randomUUID()

      const result = await analyzeSession({
        tenant_id: tenantId,
        user_id: userId,
        face_image_b64: faceImageB64 ?? '',
        cognitive_session_id: sessionId,
      })
      setResult(result)
    } catch {
      const mock = generateMockResult(cognitiveResult?.score)
      setResult(mock)
    }
  }

  const handleReset = () => {
    analysisCalledRef.current = false
    reset()
  }

  return (
    <div className="min-h-screen bg-hv-bg pt-24 pb-16 px-4">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-60" />
      <div className="max-w-2xl mx-auto relative">
        <div className="text-center mb-8">
          <h1 className="font-black text-3xl sm:text-4xl text-hv-text mb-2">
            Identity Verification
          </h1>
          <p className="text-hv-muted text-sm">
            Complete the 3-step Hybrid Vector verification protocol
          </p>
        </div>

        <StepIndicator currentStep={currentStep} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl border border-white/5 p-6 sm:p-8"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-hv-cyan tracking-widest uppercase">Step 1</span>
                </div>
                <h2 className="text-xl font-bold text-hv-text">Face Capture</h2>
                <p className="text-hv-muted text-sm mt-1">
                  We use your camera to perform facial liveness detection
                </p>
              </div>

              <FaceCapture
                capturedImage={faceImageB64}
                onCapture={handleCapture}
                onRetake={handleRetake}
              />

              {faceImageB64 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-hv-cyan text-hv-bg hover:bg-hv-cyan-dark transition-all duration-200"
                    style={{ boxShadow: '0 0 16px rgba(0,194,255,0.35)' }}
                  >
                    Continue
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl border border-white/5 p-6 sm:p-8"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-hv-cyan tracking-widest uppercase">Step 2</span>
                </div>
                <h2 className="text-xl font-bold text-hv-text">Prove You&apos;re Human</h2>
                <p className="text-hv-muted text-sm mt-1">
                  Complete the cognitive challenge to generate your behavioral fingerprint
                </p>
              </div>

              <CognitiveTest onComplete={handleCognitiveComplete} />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl border border-white/5 p-6 sm:p-8"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-hv-cyan tracking-widest uppercase">Step 3</span>
                </div>
                <h2 className="text-xl font-bold text-hv-text">Analysis</h2>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-hv-red/10 border border-hv-red/30 mb-6"
                >
                  <AlertCircle size={16} className="text-hv-red mt-0.5 shrink-0" />
                  <p className="text-sm text-hv-red">{error}</p>
                </motion.div>
              )}

              {!currentSession && !isAnalyzing && (
                <AnalysisLoader onDone={handleAnalysisDone} />
              )}

              {isAnalyzing && !currentSession && (
                <AnalysisLoader onDone={() => {}} />
              )}

              {currentSession && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col items-center gap-4">
                    <TrustScore score={currentSession.trust_score} size={200} />
                    <StatusBadge
                      status={currentSession.is_human ? 'HUMAN' : 'BOT'}
                      large
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    {[
                      {
                        label: 'Confidence',
                        value: currentSession.confidence_level,
                        color:
                          currentSession.confidence_level === 'HIGH'
                            ? '#00C2FF'
                            : currentSession.confidence_level === 'MEDIUM'
                              ? '#F97316'
                              : '#EF4444',
                      },
                      {
                        label: 'Processing',
                        value: `${currentSession.processing_time_ms}ms`,
                        color: '#9CA3AF',
                      },
                      {
                        label: 'Session',
                        value: currentSession.session_id.slice(0, 8) + '…',
                        color: '#9CA3AF',
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="glass rounded-xl p-3"
                      >
                        <div className="font-bold text-sm" style={{ color }}>
                          {value}
                        </div>
                        <div className="text-hv-muted mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="glass rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-bold text-hv-text mb-4 tracking-wider uppercase">
                      Score Breakdown
                    </h3>
                    <ScoreBreakdown
                      facialLiveness={currentSession.facial_liveness}
                      facialConfidence={currentSession.facial_confidence}
                      cognitiveScore={currentSession.cognitive_score}
                      behavioralBonus={currentSession.behavioral_bonus}
                    />
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border border-white/10 text-hv-muted hover:text-hv-text hover:border-white/20 transition-all duration-200"
                  >
                    <RotateCcw size={15} />
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-hv-muted mt-6 leading-relaxed">
          This demo uses simulated API responses when no backend is configured.
          <br />
          No biometric data is stored or transmitted outside your browser.
        </p>
      </div>
    </div>
  )
}
