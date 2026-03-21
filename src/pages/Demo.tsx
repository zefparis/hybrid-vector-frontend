import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaceCapture } from '@/components/FaceCapture'
import { VocalImprint } from '@/components/VocalImprint'
import { NeuralReflex } from '@/components/NeuralReflex'
import { TrustScore } from '@/components/TrustScore'
import { ScanProgress } from '@/components/ScanProgress'
import { useSessionStore } from '@/store/sessionStore'
import { analyzeSession, generateMockResult, computeCognitiveScore, scoreMouseBehavior } from '@/services/api'
import { useSensors } from '@/hooks/useSensors'
import { useTypewriter } from '@/hooks/useTypewriter'
import { playSuccess } from '@/utils/sounds'
import type { VocalImportData, ReflexResult } from '@/types'
import { useT } from '@/i18n/useLang'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

function ScanHeader({ elapsed }: { elapsed: number }) {
  const { t } = useT()
  const timeLeft = Math.max(0, 60 - Math.floor(elapsed / 1000))
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  const STATUS_TEXTS = [
    t('demo_status_init'),
    t('demo_status_facial'),
    t('demo_status_vocal'),
    t('demo_status_reflex'),
    t('demo_status_online'),
  ]

  const [statusIdx, setStatusIdx] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS_TEXTS.length), 3500)
    return () => clearInterval(interval)
  }, [STATUS_TEXTS.length])
  const statusText = useTypewriter(STATUS_TEXTS[statusIdx], 25)

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 28 28">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
          </svg>
          <span className="text-xs sm:text-sm font-black tracking-widest" style={{ color: '#F0F4FF' }}>
            HYBRID VECTOR
          </span>
        </div>
        <div className="font-mono text-sm font-bold tabular-nums tracking-wider" style={{ color: '#00C2FF' }}>
          {mm}:{ss}
        </div>
      </div>
      <div className="h-px w-full my-3" style={{ backgroundColor: '#1E2D45' }} />
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
        <span className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          {t('demo_protocol')}
        </span>
        <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#00C2FF' }}>
          STATUS: {statusText}<span className="animate-pulse">_</span>
        </span>
      </div>
    </div>
  )
}

function AnalysisSequence({ onDone }: { onDone: () => void }) {
  const { t } = useT()
  const ANALYSIS_LINES = [
    t('analysis_facial'),
    t('analysis_liveness'),
    t('analysis_vocal'),
    t('analysis_cognitive'),
    t('analysis_behavioral'),
    t('analysis_pqc'),
    t('analysis_computing'),
  ]

  const [lineIdx, setLineIdx] = useState(0)
  const [progress, setProgress] = useState<number[]>([])

  useEffect(() => {
    if (lineIdx >= ANALYSIS_LINES.length) {
      const timer = setTimeout(onDone, 600)
      return () => clearTimeout(timer)
    }

    const dur = lineIdx < ANALYSIS_LINES.length - 2 ? 350 : 500
    const timer2 = setTimeout(() => {
      setProgress((p) => [...p, 100])
      setLineIdx((i) => i + 1)
    }, dur)
    return () => clearTimeout(timer2)
  }, [lineIdx, onDone, ANALYSIS_LINES.length])

  useEffect(() => {
    if (lineIdx < ANALYSIS_LINES.length) {
      setProgress((p) => {
        const next = [...p]
        next[lineIdx] = 0
        return next
      })
      const timer3 = setTimeout(() => {
        setProgress((p) => {
          const next = [...p]
          next[lineIdx] = lineIdx < ANALYSIS_LINES.length - 2 ? 100 : 60
          return next
        })
      }, 50)
      return () => clearTimeout(timer3)
    }
  }, [lineIdx])

  return (
    <div className="flex flex-col gap-3 py-4">
      <p className="text-xs font-bold tracking-widest text-center mb-2" style={{ color: '#00C2FF' }}>
        HYBRID TRUST SCORE COMPUTING
      </p>
      <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />
      <div className="space-y-2 py-2">
        {ANALYSIS_LINES.map((line, i) => {
          if (i > lineIdx) return null
          const p = progress[i] ?? 0
          const done = p >= 100
          return (
            <motion.div
              key={line}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3"
            >
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider flex-1 whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ color: done ? '#F0F4FF' : '#8899BB' }}>
                {line}
              </span>
              <div className="w-20 sm:w-28 h-1.5 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: '#1E2D45' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: done ? '#00FF88' : '#00C2FF' }}
                  animate={{ width: `${p}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] font-bold tracking-wider w-16 text-right shrink-0"
                style={{ color: done ? '#00FF88' : '#8899BB' }}>
                {done ? 'COMPLETE' : '...'}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function ScanLineOverlay() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-0"
      style={{
        background: 'linear-gradient(90deg, transparent 10%, rgba(0,194,255,0.12) 50%, transparent 90%)',
      }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export function Demo() {
  const { t } = useT()
  const {
    phase,
    faceImageB64,
    faceDescriptor,
    faceConfidence,
    vocalData,
    reflexResult,
    currentSession,
    isAnalyzing,
    setPhase,
    startAnalysis,
    setResult,
    setFaceImage,
    setFaceDetection,
    setVocalData,
    setReflexResult,
    reset,
  } = useSessionStore()

  const { recordTap, getSnapshot, startScan, stopScan, isMobile } = useSensors()
  const analysisCalledRef = useRef(false)
  const startTimeRef = useRef(performance.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase === 'idle') {
      setPhase('facial')
      startTimeRef.current = performance.now()
      startScan()
    }
  }, [phase, setPhase, startScan])

  useEffect(() => {
    if (phase === 'result') return
    const t = setInterval(() => setElapsed(performance.now() - startTimeRef.current), 200)
    return () => clearInterval(t)
  }, [phase])

  const handleFaceCapture = useCallback((img: string, pointerPressure?: number) => {
    if (!isMobile) {
      recordTap(pointerPressure)
    }
    setFaceImage(img)
  }, [isMobile, recordTap, setFaceImage])

  const handleLivenessComplete = useCallback((_frames: string[], descriptor?: Float32Array) => {
    const confidence = descriptor ? 0.92 : 0
    setFaceDetection(descriptor ?? null, confidence)
  }, [setFaceDetection])

  const handleFaceRetake = useCallback(() => {
    setFaceImage('')
  }, [setFaceImage])

  const handleFaceProceed = useCallback(() => {
    setPhase('vocal')
  }, [setPhase])

  const handleVocalComplete = useCallback((data: VocalImportData) => {
    setVocalData(data)
    setTimeout(() => setPhase('reflex'), 800)
  }, [setVocalData, setPhase])

  const handleReflexComplete = useCallback((result: ReflexResult) => {
    setReflexResult(result)
    setTimeout(() => setPhase('analysis'), 1000)
  }, [setReflexResult, setPhase])

  const handleAnalysisDone = useCallback(async () => {
    if (analysisCalledRef.current || useSessionStore.getState().isAnalyzing) return
    analysisCalledRef.current = true
    startAnalysis()

    stopScan()
    const sensors = getSnapshot()
    const stroopRounds = vocalData?.rounds.filter((r) => r.isStroop) ?? []
    const stroopCorrectCount = stroopRounds.filter((r) => r.stroopCorrect).length
    const stroopAccuracy = stroopRounds.length > 0 ? stroopCorrectCount / stroopRounds.length : 0
    const mouseScore = sensors.mouseBehavior ? scoreMouseBehavior(sensors.mouseBehavior) : undefined
    console.log('[DEMO] cognitive score inputs:', JSON.stringify({
      sensorVariance: sensors.deviceMotionVariance,
      accelerometerSamples: sensors.accelerometer.length,
      gyroscopeSamples: sensors.gyroscope.length,
      touchPressureSamples: sensors.touchPressure.length,
      tapTimings: sensors.tapTimings,
      mouseBehavior: Boolean(sensors.mouseBehavior),
      mouseScore,
    }))
    const cogScore = computeCognitiveScore({
      vocalReactionTime: vocalData?.avgReactionMs ?? 800,
      stroopAccuracy,
      reflexAccuracy: reflexResult ? reflexResult.intercepted / reflexResult.total : 0.5,
      reflexVelocity: reflexResult?.avgVelocityMs ?? 600,
      sensorVariance: sensors.deviceMotionVariance,
      accelerometer: sensors.accelerometer,
      gyroscope: sensors.gyroscope,
      touchPressure: sensors.touchPressure,
      tapTimings: sensors.tapTimings,
      mouseHumanScore: mouseScore,
    })
    const cognitiveScoreOverride = Math.max(0, Math.min(1, cogScore / 100))
    console.log('[DEMO] cognitive score override normalized:', JSON.stringify({
      raw: cogScore,
      normalized: cognitiveScoreOverride,
    }))

    try {
      const tenantId = (import.meta.env.VITE_TENANT_ID as string) || 'demo-tenant'
      const result = await analyzeSession({
        tenant_id: tenantId,
        user_id: `user-${Date.now()}`,
        face_detected: !!faceDescriptor,
        face_confidence: faceConfidence,
        face_descriptor: faceDescriptor ? Array.from(faceDescriptor) : undefined,
        cognitive_session_id: crypto.randomUUID(),
        cognitive_score_override: cognitiveScoreOverride,
      })
      setResult(result)
      playSuccess()
    } catch {
      const mock = generateMockResult(cogScore)
      setResult(mock)
      playSuccess()
    }
  }, [vocalData, reflexResult, faceDescriptor, faceConfidence, startAnalysis, setResult, getSnapshot, stopScan])

  const handleReset = useCallback(() => {
    analysisCalledRef.current = false
    startTimeRef.current = performance.now()
    setElapsed(0)
    reset()
  }, [reset])

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 sm:px-4 overflow-x-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />
      <ScanLineOverlay />

      <div className="max-w-2xl mx-auto relative w-full pt-6 sm:pt-8">
        <div
          className="rounded-2xl p-5 sm:p-7 relative overflow-hidden"
          style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
        >
          <ScanHeader elapsed={elapsed} />
          <ScanProgress phase={phase} />

          <div className="h-px w-full my-5" style={{ backgroundColor: '#1E2D45' }} />

          <AnimatePresence mode="wait">
            {phase === 'facial' && (
              <motion.div key="facial"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                <FaceCapture
                  capturedImage={faceImageB64}
                  onCapture={handleFaceCapture}
                  onRetake={handleFaceRetake}
                  onProceed={handleFaceProceed}
                  onLivenessComplete={handleLivenessComplete}
                />
              </motion.div>
            )}

            {phase === 'vocal' && (
              <motion.div key="vocal"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                <VocalImprint onComplete={handleVocalComplete} />
              </motion.div>
            )}

            {phase === 'reflex' && (
              <motion.div key="reflex"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                <NeuralReflex onComplete={handleReflexComplete} />
              </motion.div>
            )}

            {phase === 'analysis' && (
              <motion.div key="analysis"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                <AnalysisSequence onDone={handleAnalysisDone} />
              </motion.div>
            )}

            {phase === 'result' && currentSession && (
              <motion.div key="result"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
                <TrustScore session={currentSession} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] tracking-wider mt-5 leading-relaxed" style={{ color: '#8899BB' }}>
          {t('disclaimer')}
        </p>
      </div>
    </div>
  )
}
