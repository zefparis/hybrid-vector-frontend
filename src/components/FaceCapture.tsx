import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaceCaptureProps {
  capturedImage: string | null
  onCapture: (imageSrc: string) => void
  onRetake: () => void
}

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'user',
}

export function FaceCapture({ capturedImage, onCapture, onRetake }: FaceCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [permissionState, setPermissionState] = useState<'waiting' | 'granted' | 'denied'>('waiting')
  const [isCapturing, setIsCapturing] = useState(false)
  const [scanLine, setScanLine] = useState(false)

  const handleUserMedia = useCallback(() => {
    setPermissionState('granted')
  }, [])

  const handleUserMediaError = useCallback(() => {
    setPermissionState('denied')
  }, [])

  const capture = useCallback(() => {
    setIsCapturing(true)
    setScanLine(true)
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot()
      if (imageSrc) {
        onCapture(imageSrc)
      }
      setIsCapturing(false)
      setScanLine(false)
    }, 600)
  }, [onCapture])

  if (capturedImage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative rounded-2xl overflow-hidden border-2 border-hv-green/40 shadow-green-glow">
          <img
            src={capturedImage}
            alt="Captured face"
            className="w-full max-w-sm object-cover"
            style={{ maxHeight: 320 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-hv-bg/60 to-transparent" />
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hv-green/20 border border-hv-green/40 backdrop-blur-sm">
              <CheckCircle2 size={13} className="text-hv-green" />
              <span className="text-xs font-semibold text-hv-green">Captured</span>
            </div>
          </div>
        </div>

        <button
          onClick={onRetake}
          className="flex items-center gap-2 btn-ghost text-sm"
        >
          <RotateCcw size={15} />
          Retake Photo
        </button>
      </motion.div>
    )
  }

  if (permissionState === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 py-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-hv-red/10 border border-hv-red/30 flex items-center justify-center">
          <AlertTriangle size={28} className="text-hv-red" />
        </div>
        <div>
          <p className="text-hv-text font-semibold">Camera Access Required</p>
          <p className="text-hv-muted text-sm mt-1">
            Please allow camera access in your browser settings and reload the page.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-ghost text-sm"
        >
          Reload Page
        </button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative rounded-2xl overflow-hidden border border-hv-cyan/20 bg-hv-bg">
        {permissionState === 'waiting' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-hv-bg">
            <div className="w-10 h-10 rounded-full border-2 border-hv-cyan/30 border-t-hv-cyan animate-spin" />
            <p className="text-hv-muted text-sm">Initializing camera...</p>
          </div>
        )}

        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full max-w-sm"
          style={{ maxHeight: 320, objectFit: 'cover', display: 'block' }}
        />

        {permissionState === 'granted' && (
          <>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border border-hv-cyan/20 rounded-lg" />
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-hv-cyan rounded-tl-sm" />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-hv-cyan rounded-tr-sm" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-hv-cyan rounded-bl-sm" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-hv-cyan rounded-br-sm" />
            </div>

            <AnimatePresence>
              {scanLine && (
                <motion.div
                  initial={{ top: '0%', opacity: 0 }}
                  animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 z-10 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #00C2FF, transparent)',
                    boxShadow: '0 0 8px rgba(0,194,255,0.8)',
                  }}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {permissionState === 'granted' && (
        <p className="text-hv-muted text-sm text-center">
          Center your face in the frame and ensure good lighting
        </p>
      )}

      <button
        onClick={capture}
        disabled={permissionState !== 'granted' || isCapturing}
        className={cn(
          'w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200',
          permissionState === 'granted' && !isCapturing
            ? 'bg-hv-cyan text-hv-bg cyan-glow hover:bg-hv-cyan-dark'
            : 'bg-white/5 text-hv-muted cursor-not-allowed',
        )}
      >
        <Camera size={18} />
        {isCapturing ? 'Capturing...' : 'Capture Face'}
      </button>
    </div>
  )
}
