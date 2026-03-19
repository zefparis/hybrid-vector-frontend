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
}

const VIDEO_CONSTRAINTS = { width: 640, height: 480, facingMode: 'user' as const }

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

function FaceOvalGuide() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg width="160" height="200" viewBox="0 0 160 200" fill="none" className="opacity-50">
        <ellipse
          cx="80" cy="100" rx="65" ry="85"
          stroke="#00C2FF" strokeWidth="1.5" strokeDasharray="8 6"
          className="animate-[spin_8s_linear_infinite]"
          style={{ transformOrigin: '80px 100px' }}
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

export function FaceCapture({ capturedImage, onCapture, onRetake, onProceed }: FaceCaptureProps) {
  const { t, tArr } = useT()
  const webcamRef = useRef<Webcam>(null)
  const capturePressureRef = useRef<number | undefined>(undefined)
  const [permission, setPermission] = useState<'waiting' | 'granted' | 'denied'>('waiting')
  const [isCapturing, setIsCapturing] = useState(false)
  const [flashVisible, setFlashVisible] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const floatingLabels = [...tArr('face_labels'), 'NEURAL POINTS']
  const successLines = [t('face_mapped'), t('face_liveness'), t('face_depth'), t('face_points')]

  const statusText = useTypewriter(
    capturedImage ? t('face_mapped') : t('face_align'),
    35,
  )

  useEffect(() => {
    if (capturedImage) setShowSuccess(true)
  }, [capturedImage])

  const handleCapture = useCallback(() => {
    if (isCapturing) return
    setIsCapturing(true)
    setFlashVisible(true)
    playCapture()
    playScan()

    setTimeout(() => setFlashVisible(false), 150)

    setTimeout(() => {
      const img = webcamRef.current?.getScreenshot()
      if (img) onCapture(img, capturePressureRef.current)
      capturePressureRef.current = undefined
      setIsCapturing(false)
    }, 500)
  }, [isCapturing, onCapture])

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
            <CornerBrackets color="#00C2FF" />
            <FaceOvalGuide />
            <ScanLine />
            <FloatingLabels labels={floatingLabels} />
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
          style={{ backgroundColor: capturedImage ? '#00FF88' : '#00C2FF' }} />
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest"
          style={{ color: capturedImage ? '#00FF88' : '#8899BB' }}>
          {statusText}
        </span>
      </div>

      {!capturedImage && (
        <button
          onClick={handleCapture}
          onPointerDown={(e) => {
            capturePressureRef.current = e.pressure > 0 ? e.pressure : undefined
          }}
          disabled={permission !== 'granted' || isCapturing}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 touch-manipulation"
          style={{
            border: '1.5px solid rgba(0,194,255,0.5)',
            color: permission === 'granted' ? '#00C2FF' : '#8899BB',
            backgroundColor: 'transparent',
            boxShadow: permission === 'granted' ? '0 0 20px rgba(0,194,255,0.15)' : 'none',
            opacity: isCapturing ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          {isCapturing ? 'SCANNING...' : t('face_initiate')}
        </button>
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
            onClick={() => { onRetake(); setShowSuccess(false) }}
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
