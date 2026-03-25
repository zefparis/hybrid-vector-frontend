import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { playCapture, playScan } from '@/utils/sounds'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useT } from '@/i18n/useLang'
import { useFaceApi } from '@/hooks/useFaceApi'
import styles from '@/hvguard/theme.module.css'

interface FaceCaptureProps {
  capturedImage: string | null
  onCapture: (imageSrc: string, pointerPressure?: number) => void
  onRetake: () => void
  onProceed: () => void
  proceedLabel?: string
  onLivenessComplete?: (frames: string[], descriptor?: Float32Array) => void
}

type LivenessStep = 'idle' | 'warmup' | 'center' | 'confirm'

const STEP_DURATION_MS = 2000

const WARMUP_DURATION_MS = 3000

const STEP_CONFIG: Record<'center', { labelFr: string; labelEn: string; index: number }> = {
  center: { labelFr: 'REGARDEZ DROIT DEVANT', labelEn: 'LOOK STRAIGHT AHEAD', index: 0 },
}

function CornerBrackets({ color, glow }: { color: string; glow?: boolean }) {
  const filter = glow ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})` : 'none'
  const s = { borderColor: color, filter, transition: 'filter 0.4s ease' }
  return (
    <div className="absolute inset-3 sm:inset-4 pointer-events-none">
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2" style={s} />
      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2" style={s} />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2" style={s} />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2" style={s} />
    </div>
  )
}

function FaceOvalGuide({ progress }: { progress: number }) {
  const circ = 2 * Math.PI * 85
  const filled = circ * progress
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg width="160" height="200" viewBox="0 0 160 200" fill="none">
        <ellipse
          cx="80" cy="100" rx="65" ry="85"
          stroke="#1E2D45" strokeWidth="1.5" strokeDasharray="8 6"
          opacity="0.5"
        />
        <ellipse
          cx="80" cy="100" rx="65" ry="85"
          stroke="#00C2FF" strokeWidth="2.5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(0,194,255,0.6))',
            transition: 'stroke-dasharray 0.6s ease-out',
          }}
        />
      </svg>
    </div>
  )
}

const scanKeyframes = `@keyframes scanSweep{0%{top:0%}100%{top:100%}}`

function ScanLine() {
  return (
    <>
      <style>{scanKeyframes}</style>
      <div
        className="absolute left-0 right-0 pointer-events-none z-10"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,194,255,0.2) 20%, #00C2FF 50%, rgba(0,194,255,0.2) 80%, transparent 100%)',
          boxShadow: '0 0 12px rgba(0,194,255,0.5), 0 0 40px rgba(0,194,255,0.15)',
          animation: 'scanSweep 2s linear infinite',
        }}
      />
    </>
  )
}

function StepCircle({ progress }: { progress: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)
  const done = progress >= 1
  const color = done ? '#00FF88' : '#00C2FF'
  return (
    <div className="absolute top-3 right-3 z-10 pointer-events-none">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="rgba(10,15,30,0.7)" stroke="#1E2D45" strokeWidth="1.5" />
        <circle
          cx="18" cy="18" r={r}
          fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s',
          }}
        />
        <text
          x="18" y="18" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="9" fontWeight="700"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {done ? '\u2713' : `${Math.round(progress * 100)}`}
        </text>
      </svg>
    </div>
  )
}

function DataReadout({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
      <div
        className="rounded"
        style={{ padding: '4px 8px', backgroundColor: 'rgba(10,15,30,0.6)' }}
      >
        <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="text-[9px] tracking-wider" style={{ color: '#8899BB' }}>ANALYSE AWS REKOGNITION: </span>
          <span className="text-[9px] font-bold tracking-wider" style={{ color: '#00C2FF' }}>
            STEP {Math.min(stepIndex + 1, 1)}/1
          </span>
        </div>
      </div>
    </div>
  )
}

function DirectionArrow() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#00C2FF" strokeWidth="2" opacity="0.4" />
          <circle cx="24" cy="24" r="6" fill="#00C2FF" opacity="0.8" />
          <circle cx="24" cy="24" r="3" fill="#00C2FF" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

function LivenessProgress({ step, timer }: { step: number; timer: number }) {
  const total = 1
  return (
    <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === step
          const isDone = i < step
          return (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: isDone ? '#00FF88' : isCurrent ? '#00C2FF' : 'transparent',
                  width: isDone ? '100%' : isCurrent ? `${(timer / STEP_DURATION_MS) * 100}%` : '0%',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )
        })}
      </div>
      <p className="text-center text-[9px] font-semibold tracking-widest mt-1.5" style={{ color: '#8899BB' }}>
        {step < total ? `${step + 1} / ${total}` : '✓'}
      </p>
    </div>
  )
}

export function FaceCapture({ capturedImage, onCapture, onRetake, onProceed, proceedLabel, onLivenessComplete }: FaceCaptureProps) {
  const { t, lang } = useT()
  const webcamRef = useRef<Webcam>(null)
  const capturePressureRef = useRef<number | undefined>(undefined)
  const [permission, setPermission] = useState<'waiting' | 'granted' | 'denied'>('waiting')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [videoConstraints, setVideoConstraints] = useState<MediaTrackConstraints | null>(null)
  const [flashVisible, setFlashVisible] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Probe camera on mount — try exact:'user' (Samsung Browser) then fallback
  useEffect(() => {
    let cancelled = false
    const probeCamera = async () => {
      // FIX 3: exact:'user' forces front camera on Samsung Browser
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } }
        })
        stream.getTracks().forEach(t => t.stop())
        if (!cancelled) {
          console.log('[FACE] camera probe OK — exact:user')
          setVideoConstraints({ facingMode: { exact: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } })
        }
        return
      } catch (e) {
        console.warn('[FACE] exact:user failed, trying fallback:', (e as Error).message)
      }
      // Fallback to simple 'user'
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        })
        stream.getTracks().forEach(t => t.stop())
        if (!cancelled) {
          console.log('[FACE] camera probe OK — facingMode:user')
          setVideoConstraints({ facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } })
        }
        return
      } catch (e) {
        console.error('[FACE] camera access failed:', e)
        if (!cancelled) {
          setPermission('denied')
          setCameraError((e as Error).message || 'Camera access denied')
        }
      }
    }
    probeCamera()
    return () => { cancelled = true }
  }, [])

  const [livenessStep, setLivenessStep] = useState<LivenessStep>('idle')
  const [livenessFrames, setLivenessFrames] = useState<string[]>([])
  const [stepTimer, setStepTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepStartRef = useRef(0)
  const livenessStartedRef = useRef(false)

  // face-api.js — client-side face detection
  const { loaded: faceApiLoaded, detectFace } = useFaceApi()
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceScore, setFaceScore] = useState(0)
  const descriptorRef = useRef<Float32Array | null>(null)
  const detectionLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const statusText = useTypewriter(
    capturedImage
      ? t('face_capture_complete')
      : livenessStep === 'warmup'
        ? t('face_initializing_engine')
      : livenessStep === 'confirm'
        ? t('face_identity_confirmed')
      : livenessStep === 'center'
        ? STEP_CONFIG.center[lang === 'fr' ? 'labelFr' : 'labelEn']
        : t('face_align'),
    35,
  )

  // Real-time face detection loop during active liveness steps
  useEffect(() => {
    const isActiveStep = livenessStep === 'center'
    if (!faceApiLoaded || !isActiveStep || capturedImage) {
      setFaceDetected(false)
      setFaceScore(0)
      if (detectionLoopRef.current) clearTimeout(detectionLoopRef.current)
      return
    }

    let cancelled = false
    const runDetection = async () => {
      const video = webcamRef.current?.video
      if (video && video.readyState >= 4 && !cancelled) {
        const result = await detectFace(video)
        if (!cancelled) {
          setFaceDetected(!!result)
          setFaceScore(result ? 75 : 0)
          if (result?.descriptor) {
            descriptorRef.current = result.descriptor
          }
        }
      }
      if (!cancelled) {
        detectionLoopRef.current = setTimeout(runDetection, 300)
      }
    }
    runDetection()

    return () => {
      cancelled = true
      if (detectionLoopRef.current) clearTimeout(detectionLoopRef.current)
    }
  }, [livenessStep, faceApiLoaded, capturedImage, detectFace])

  useEffect(() => {
    if (capturedImage) setShowSuccess(true)
  }, [capturedImage])

  const captureFrame = useCallback((): string | null => {
    const video = webcamRef.current?.video
    // FIX 5: Ensure video is fully ready
    if (!video || video.readyState < 4 || video.videoWidth === 0) {
      console.warn('[FACE] video not ready — readyState:', video?.readyState, 'videoWidth:', video?.videoWidth)
      return null
    }

    // FIX 1: Capture at full video resolution via canvas
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn('[FACE] canvas context unavailable')
      return null
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // FIX 2: High JPEG quality
    const img = canvas.toDataURL('image/jpeg', 0.92)

    const b64 = img.replace(/^data:image\/\w+;base64,/, '')
    console.log('[FACE] captured frame — resolution:', canvas.width, 'x', canvas.height, 'b64 length:', b64.length)

    // FIX 4: Minimum size check
    if (b64.length < 50000) {
      console.warn('[FACE] frame too small:', b64.length, '— need 50000+')
      return null
    }

    return img
  }, [])

  const advanceStep = useCallback((currentStep: LivenessStep, frames: string[], retryCount = 0) => {
    // Capture BEFORE flash to avoid grabbing white overlay
    const frame = captureFrame()
    if (!frame) {
      if (retryCount < 3) {
        console.warn('[FACE] capture failed at step:', currentStep, '— retry', retryCount + 1)
        setTimeout(() => advanceStep(currentStep, frames, retryCount + 1), 500)
        return
      }
      console.error('[FACE] capture failed after 3 retries at step:', currentStep)
      return
    }

    setFlashVisible(true)
    playCapture()
    setTimeout(() => setFlashVisible(false), 150)

    const newFrames = [...frames, frame]
    setLivenessFrames(newFrames)

    if (currentStep === 'center') {
      setLivenessStep('confirm')
      playScan()
      onCapture(newFrames[0])
      onLivenessComplete?.(newFrames, descriptorRef.current ?? undefined)
    }
  }, [captureFrame, onCapture, onLivenessComplete])

  // Timer for each liveness step
  useEffect(() => {
    if (livenessStep === 'idle' || livenessStep === 'warmup' || livenessStep === 'confirm') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    stepStartRef.current = Date.now()
    setStepTimer(0)

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - stepStartRef.current
      setStepTimer(elapsed)

      if (elapsed >= STEP_DURATION_MS) {
        if (timerRef.current) clearInterval(timerRef.current)
        setStepTimer(STEP_DURATION_MS)
        setLivenessFrames((prevFrames) => {
          setTimeout(() => advanceStep(livenessStep, prevFrames), 50)
          return prevFrames
        })
      }
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [livenessStep, advanceStep])

  // Start liveness sequence when permission granted
  const startLiveness = useCallback(() => {
    if (livenessStartedRef.current || capturedImage) return
    livenessStartedRef.current = true
    setLivenessStep('warmup')
    setLivenessFrames([])
  }, [capturedImage])

  const [warmupProgress, setWarmupProgress] = useState(0)
  useEffect(() => {
    if (livenessStep !== 'warmup') {
      setWarmupProgress(0)
      return
    }
    const start = Date.now()
    const iv = setInterval(() => {
      const elapsed = Date.now() - start
      setWarmupProgress(Math.min(elapsed / WARMUP_DURATION_MS, 1))
      if (elapsed >= WARMUP_DURATION_MS) {
        clearInterval(iv)
        setLivenessStep('center')
      }
    }, 50)
    return () => clearInterval(iv)
  }, [livenessStep])

  const handleRetake = useCallback(() => {
    livenessStartedRef.current = false
    setLivenessStep('idle')
    setLivenessFrames([])
    setStepTimer(0)
    setShowSuccess(false)
    onRetake()
  }, [onRetake])

  const livenessStepIndex = livenessStep === 'confirm' ? 1
    : livenessStep === 'center' ? 0
    : -1

  const arcProgress = livenessStep === 'idle' || livenessStep === 'warmup' ? 0
    : livenessStep === 'confirm' ? 1
    : 0

  if (permission === 'denied') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ border: '2px solid #FF3355', backgroundColor: 'rgba(255,51,85,0.1)' }}>
          <span className="text-xl" style={{ color: '#FF3355' }}>✗</span>
        </div>
        <p className="text-[#F0F4FF] font-bold text-sm">{t('face_camera_access_required')}</p>
        <p className="text-[#8899BB] text-xs max-w-xs">
          {t('face_camera_access_denied')}
        </p>
        {cameraError && (
          <p className="text-[#FF3355]/60 text-[10px] font-mono max-w-xs">{cameraError}</p>
        )}
        <button onClick={() => window.location.reload()}
          className="text-xs font-semibold tracking-wider text-[#00C2FF] border border-[#1E2D45] px-4 py-2 rounded-lg hover:border-[#00C2FF]/40 transition-all duration-300">
          {t('face_reload')}
        </button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-xl overflow-hidden bg-[#0A0F1E] border border-[#1E2D45]"
        style={{ aspectRatio: '4/3' }}>

        {permission === 'waiting' && !capturedImage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0A0F1E]">
            <div className="w-8 h-8 rounded-full border-2 border-[#1E2D45] border-t-[#00C2FF] animate-spin" />
            <p className="text-[#8899BB] text-xs tracking-wider">{t('face_initializing_sensor')}</p>
          </div>
        )}

        {!capturedImage && videoConstraints && (
          <Webcam
            ref={webcamRef} audio={false}
            screenshotFormat="image/jpeg" screenshotQuality={0.92}
            videoConstraints={videoConstraints}
            onUserMedia={() => setPermission('granted')}
            onUserMediaError={(err) => {
              console.error('[FACE] Webcam error:', err)
              setPermission('denied')
              setCameraError(typeof err === 'string' ? err : err.message || 'Camera failed to start')
            }}
            className="w-full h-full object-cover block"
          />
        )}

        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover block" />
        )}

        {!capturedImage && permission === 'granted' && livenessStep === 'warmup' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0A0F1E]/60">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#00C2FF', filter: 'drop-shadow(0 0 8px #00C2FF)' }}
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="text-xs font-bold tracking-[0.2em]" style={{ color: '#00C2FF' }}>
              {t('face_initializing_engine')}
            </p>
            <p className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>
              {t('face_calibrating_scanner')}
            </p>
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#00C2FF', width: `${warmupProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        )}

        {!capturedImage && permission === 'granted' && (
          <>
            <CornerBrackets color={livenessStep === 'confirm' ? '#00FF88' : '#00C2FF'} glow={livenessStep === 'confirm'} />
            <FaceOvalGuide progress={arcProgress} />
            <ScanLine />

            <AnimatePresence mode="wait">
              {livenessStep === 'center' && <DirectionArrow key={livenessStep} />}
            </AnimatePresence>

            {livenessStep !== 'idle' && livenessStep !== 'warmup' && (
              <>
                <LivenessProgress step={livenessStepIndex} timer={stepTimer} />
                <StepCircle progress={arcProgress} />
                {livenessStep !== 'confirm' && <DataReadout stepIndex={livenessStepIndex} />}
              </>
            )}

            {livenessStep === 'center' && (
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <div className="rounded px-2 py-1" style={{ backgroundColor: 'rgba(10,15,30,0.7)' }}>
                  <div className="flex items-center gap-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: faceDetected ? '#00FF88' : '#FF3355',
                        boxShadow: faceDetected ? '0 0 6px #00FF88' : '0 0 6px #FF3355',
                      }}
                    />
                    <span className="text-[9px] font-bold tracking-wider" style={{ color: faceDetected ? '#00FF88' : '#FF3355' }}>
                      {faceDetected
                        ? t('face_face_score').replace('{score}', String(Math.round(faceScore)))
                        : t('face_no_face')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {livenessStep === 'confirm' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,255,136,0.15)', border: '2px solid #00FF88' }}>
                  <span className="text-2xl" style={{ color: '#00FF88' }}>✓</span>
                </div>
              </motion.div>
            )}
          </>
        )}

        {capturedImage && showSuccess && (
          <>
            <CornerBrackets color="#00FF88" glow />
            <StepCircle progress={1} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E]/60 via-transparent to-transparent pointer-events-none" />
          </>
        )}

        <AnimatePresence>
          {flashVisible && (
            <motion.div
              className="absolute inset-0 z-30 bg-white"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 h-5">
        <div className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: capturedImage ? '#00FF88' : livenessStep === 'confirm' ? '#00FF88' : '#00C2FF' }} />
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest"
          style={{ color: capturedImage ? '#00FF88' : livenessStep === 'confirm' ? '#00FF88' : '#8899BB' }}>
          {statusText}
        </span>
      </div>

      {!capturedImage && livenessStep === 'warmup' && (
        <div className="flex items-center justify-center py-3.5">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#00C2FF' }}>
              {t('face_preparing')}
            </span>
          </motion.div>
        </div>
      )}

      {!capturedImage && livenessStep === 'idle' && (
        <button
          onClick={startLiveness}
          onPointerDown={(e) => {
            capturePressureRef.current = e.pressure > 0 ? e.pressure : undefined
          }}
          disabled={permission !== 'granted'}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 touch-manipulation"
          style={{
            border: '1.5px solid rgba(0,194,255,0.5)',
            color: permission === 'granted' ? '#00C2FF' : '#8899BB',
            backgroundColor: 'transparent',
            boxShadow: permission === 'granted' ? '0 0 20px rgba(0,194,255,0.15)' : 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          {t('face_initiate')}
        </button>
      )}

      {!capturedImage && livenessStep === 'center' && (
        <div className="flex items-center justify-center py-3.5">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#00C2FF' }}>
              {t('face_rekog_analysis')}
            </span>
          </motion.div>
        </div>
      )}

      {capturedImage && (
        <div className="flex flex-col gap-3">
          <div
            className={styles.card}
            style={{
              background: 'rgba(17,24,39,0.52)',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#00FF88', boxShadow: '0 0 12px rgba(0,255,136,0.45)', flexShrink: 0 }} />
              <span className={styles.mono} style={{ color: '#00FF88', fontWeight: 800, letterSpacing: '0.14em', fontSize: 11, textTransform: 'uppercase' }}>
                Capture complete
              </span>
            </div>
            <span style={{ color: '#8899BB', fontSize: '0.78rem', lineHeight: 1.5 }}>
              Review the image, then continue or retake.
            </span>
          </div>

          <button
            onClick={onProceed}
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ width: '100%' }}
          >
            {proceedLabel ?? t('face_proceed')}
          </button>
          <button
            onClick={handleRetake}
            className={`${styles.btn} ${styles.btnOutline}`}
            style={{ width: '100%' }}
          >
            {t('face_retake')}
          </button>
        </div>
      )}
    </div>
  )
}
