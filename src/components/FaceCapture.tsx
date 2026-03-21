import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { playCapture, playScan } from '@/utils/sounds'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useT } from '@/i18n/useLang'

interface FaceCaptureProps {
  capturedImage: string | null
  onCapture: (imageSrc: string, pointerPressure?: number) => void
  onRetake: () => void
  onProceed: () => void
  onLivenessComplete?: (frames: string[]) => void
}

type LivenessStep = 'idle' | 'center' | 'right' | 'left' | 'confirm'

const VIDEO_CONSTRAINTS = { width: 640, height: 480, facingMode: 'user' as const }
const STEP_DURATION_MS = 2000

const STEP_CONFIG: Record<Exclude<LivenessStep, 'idle' | 'confirm'>, {
  labelFr: string; labelEn: string; index: number
}> = {
  center: { labelFr: 'REGARDEZ DROIT DEVANT', labelEn: 'LOOK STRAIGHT AHEAD', index: 0 },
  right:  { labelFr: 'TOURNEZ LENTEMENT À DROITE →', labelEn: 'TURN SLOWLY TO THE RIGHT →', index: 1 },
  left:   { labelFr: '← TOURNEZ LENTEMENT À GAUCHE', labelEn: '← TURN SLOWLY TO THE LEFT', index: 2 },
}

function CornerBrackets({ color }: { color: string }) {
  const s = { borderColor: color }
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

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-10"
      style={{
        background: 'linear-gradient(90deg, transparent 5%, #00C2FF 50%, transparent 95%)',
        boxShadow: '0 0 10px rgba(0,194,255,0.6)',
      }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
    />
  )
}

function FloatingLabels({ labels }: { labels: string[] }) {
  const positions = [
    { top: '18%', left: '8%' },
    { top: '25%', right: '6%' },
    { bottom: '30%', left: '5%' },
    { bottom: '18%', right: '8%' },
  ]
  return (
    <>
      {labels.map((label, i) => (
        <motion.div
          key={label}
          className="absolute pointer-events-none text-[9px] sm:text-[10px] font-semibold tracking-widest"
          style={{ color: 'rgba(0,194,255,0.6)', ...positions[i] }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: [0, 0.7, 0.7, 0], x: [10, 0, 0, -10] }}
          transition={{ duration: 3, delay: i * 1.2, repeat: Infinity, repeatDelay: 2 }}
        >
          {label}
        </motion.div>
      ))}
    </>
  )
}

function SuccessOverlay({ lines }: { lines: string[] }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 pointer-events-none z-10">
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <motion.div
            key={line}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.5 + 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#00FF88]">
              {line}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function DirectionArrow({ direction }: { direction: 'center' | 'right' | 'left' }) {
  if (direction === 'center') {
    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
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

  const isRight = direction === 'right'
  return (
    <motion.div
      className="absolute inset-0 flex items-center pointer-events-none z-10"
      style={{ justifyContent: isRight ? 'flex-end' : 'flex-start', padding: '0 24px' }}
      initial={{ opacity: 0, x: isRight ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRight ? 20 : -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.svg
        width="56" height="56" viewBox="0 0 56 56" fill="none"
        animate={{ x: isRight ? [0, 8, 0] : [0, -8, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 0 12px rgba(0,194,255,0.6))' }}
      >
        {isRight ? (
          <path d="M16 28H40M40 28L30 18M40 28L30 38" stroke="#00C2FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M40 28H16M16 28L26 18M16 28L26 38" stroke="#00C2FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </motion.svg>
    </motion.div>
  )
}

function LivenessProgress({ step, timer }: { step: number; timer: number }) {
  const total = 3
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

export function FaceCapture({ capturedImage, onCapture, onRetake, onProceed, onLivenessComplete }: FaceCaptureProps) {
  const { t, tArr } = useT()
  const webcamRef = useRef<Webcam>(null)
  const capturePressureRef = useRef<number | undefined>(undefined)
  const [permission, setPermission] = useState<'waiting' | 'granted' | 'denied'>('waiting')
  const [flashVisible, setFlashVisible] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [livenessStep, setLivenessStep] = useState<LivenessStep>('idle')
  const [livenessFrames, setLivenessFrames] = useState<string[]>([])
  const [stepTimer, setStepTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepStartRef = useRef(0)
  const livenessStartedRef = useRef(false)

  const floatingLabels = [...tArr('face_labels'), 'NEURAL POINTS']
  const successLines = [t('face_mapped'), t('face_liveness'), t('face_depth'), t('face_points')]

  const lang = t('face_align') === 'ALIGN FACE WITHIN FRAME' ? 'en' : 'fr'

  const statusText = useTypewriter(
    capturedImage
      ? t('face_mapped')
      : livenessStep !== 'idle' && livenessStep !== 'confirm'
        ? STEP_CONFIG[livenessStep][lang === 'fr' ? 'labelFr' : 'labelEn']
        : livenessStep === 'confirm'
          ? (lang === 'fr' ? 'IDENTITÉ CONFIRMÉE ✓' : 'IDENTITY CONFIRMED ✓')
          : t('face_align'),
    35,
  )

  useEffect(() => {
    if (capturedImage) setShowSuccess(true)
  }, [capturedImage])

  const captureFrame = useCallback((): string | null => {
    const video = webcamRef.current?.video
    if (!video || video.readyState < 4) {
      console.warn('[FACE] video not ready, readyState:', video?.readyState)
      return null
    }
    const img = webcamRef.current?.getScreenshot() ?? null
    if (img) {
      const b64 = img.replace(/^data:image\/\w+;base64,/, '')
      console.log('[FACE] captured frame length:', b64.length, 'starts:', b64.substring(0, 20))
    }
    return img
  }, [])

  const advanceStep = useCallback((currentStep: LivenessStep, frames: string[]) => {
    // Capture BEFORE flash to avoid grabbing white overlay
    const frame = captureFrame()
    if (!frame) {
      console.warn('[FACE] capture failed at step:', currentStep)
      return
    }

    setFlashVisible(true)
    playCapture()
    setTimeout(() => setFlashVisible(false), 150)

    const newFrames = [...frames, frame]
    setLivenessFrames(newFrames)

    if (currentStep === 'center') {
      setLivenessStep('right')
    } else if (currentStep === 'right') {
      setLivenessStep('left')
    } else if (currentStep === 'left') {
      setLivenessStep('confirm')
      playScan()
      // Pass center frame (first) to onCapture for backward compat
      onCapture(newFrames[0])
      onLivenessComplete?.(newFrames)
    }
  }, [captureFrame, onCapture, onLivenessComplete])

  // Timer for each liveness step
  useEffect(() => {
    if (livenessStep === 'idle' || livenessStep === 'confirm') {
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
        // Use functional state to get latest frames
        setLivenessFrames((prevFrames) => {
          // Schedule advance on next tick to avoid state conflicts
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
    setLivenessStep('center')
    setLivenessFrames([])
  }, [capturedImage])

  const handleRetake = useCallback(() => {
    livenessStartedRef.current = false
    setLivenessStep('idle')
    setLivenessFrames([])
    setStepTimer(0)
    setShowSuccess(false)
    onRetake()
  }, [onRetake])

  const livenessStepIndex = livenessStep === 'idle' ? -1
    : livenessStep === 'confirm' ? 3
    : STEP_CONFIG[livenessStep].index

  const arcProgress = livenessStep === 'idle' ? 0
    : livenessStep === 'confirm' ? 1
    : livenessStepIndex / 3

  if (permission === 'denied') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ border: '2px solid #FF3355', backgroundColor: 'rgba(255,51,85,0.1)' }}>
          <span className="text-xl" style={{ color: '#FF3355' }}>✗</span>
        </div>
        <p className="text-[#F0F4FF] font-bold text-sm">CAMERA ACCESS REQUIRED</p>
        <p className="text-[#8899BB] text-xs max-w-xs">
          Enable camera permissions in your browser settings, then reload.
        </p>
        <button onClick={() => window.location.reload()}
          className="text-xs font-semibold tracking-wider text-[#00C2FF] border border-[#1E2D45] px-4 py-2 rounded-lg hover:border-[#00C2FF]/40 transition-all duration-300">
          RELOAD
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
            <p className="text-[#8899BB] text-xs tracking-wider">INITIALIZING SENSOR...</p>
          </div>
        )}

        {!capturedImage && (
          <Webcam
            ref={webcamRef} audio={false}
            screenshotFormat="image/jpeg" screenshotQuality={0.92}
            videoConstraints={VIDEO_CONSTRAINTS}
            onUserMedia={() => setPermission('granted')}
            onUserMediaError={() => setPermission('denied')}
            className="w-full h-full object-cover block"
          />
        )}

        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover block" />
        )}

        {!capturedImage && permission === 'granted' && (
          <>
            <CornerBrackets color={livenessStep === 'confirm' ? '#00FF88' : '#00C2FF'} />
            <FaceOvalGuide progress={arcProgress} />
            {livenessStep === 'idle' && <ScanLine />}
            {livenessStep === 'idle' && <FloatingLabels labels={floatingLabels} />}

            <AnimatePresence mode="wait">
              {(livenessStep === 'center' || livenessStep === 'right' || livenessStep === 'left') && (
                <DirectionArrow key={livenessStep} direction={livenessStep} />
              )}
            </AnimatePresence>

            {livenessStep !== 'idle' && (
              <LivenessProgress step={livenessStepIndex} timer={stepTimer} />
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
            <CornerBrackets color="#00FF88" />
            <SuccessOverlay lines={successLines} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E]/70 via-transparent to-transparent pointer-events-none" />
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

      {!capturedImage && livenessStep !== 'idle' && livenessStep !== 'confirm' && (
        <div className="flex items-center justify-center py-3.5">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#00C2FF' }}>
              {lang === 'fr' ? 'ANALYSE DE VIE EN COURS...' : 'LIVENESS SCAN IN PROGRESS...'}
            </span>
          </motion.div>
        </div>
      )}

      {capturedImage && (
        <div className="flex flex-col gap-2">
          <button
            onClick={onProceed}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 touch-manipulation"
            style={{
              backgroundColor: '#00C2FF',
              color: '#0A0F1E',
              boxShadow: '0 0 20px rgba(0,194,255,0.3)',
            }}
          >
            {t('face_proceed')}
          </button>
          <button
            onClick={handleRetake}
            className="w-full py-2 text-[11px] font-semibold tracking-wider transition-all duration-300"
            style={{ color: '#8899BB' }}
          >
            {t('face_retake')}
          </button>
        </div>
      )}
    </div>
  )
}
