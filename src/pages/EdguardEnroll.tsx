import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { FaceCapture } from '@/components/FaceCapture'
import { VocalImprint } from '@/components/VocalImprint'
import { NeuralReflex } from '@/components/NeuralReflex'
import { useEdguardStore } from '@/store/edguardStore'
import { enrollStudent } from '@/services/edguardApi'
import { useSensors } from '@/hooks/useSensors'
import { computeCognitiveScore, scoreMouseBehavior } from '@/services/api'
import { useT } from '@/i18n/useLang'
import type { VocalImportData, ReflexResult } from '@/types'

const ENROLLMENT_URL = 'https://hybrid-vector-frontend.vercel.app/edguard/enroll'

const isMobileDevice =
  /Android|iPhone|iPad/i.test(navigator.userAgent) || 'ontouchstart' in window

type EnrollStep = 1 | 2 | 3 | 4 | 5 | 6 | 'analysis' | 'success' | 'error'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

function StepIndicator({ current }: { current: number }) {
  const { t } = useT()
  const steps = [
    t('edguard_student_id'),
    t('edguard_official_photo'),
    t('edguard_selfie'),
    'VOCAL',
    'RÉFLEXE',
    'ANALYSE',
  ]
  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-5">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const active = stepNum === current
        const done = stepNum < current
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && <div className="w-4 sm:w-8 h-px" style={{ backgroundColor: done ? '#00FF88' : '#1E2D45' }} />}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                backgroundColor: done ? 'rgba(0,255,136,0.15)' : active ? 'rgba(0,194,255,0.15)' : 'transparent',
                border: `1.5px solid ${done ? '#00FF88' : active ? '#00C2FF' : '#1E2D45'}`,
                color: done ? '#00FF88' : active ? '#00C2FF' : '#8899BB',
              }}
            >
              {done ? '✓' : stepNum}
            </div>
            <span className="hidden sm:inline text-[10px] font-semibold tracking-wider" style={{ color: active ? '#00C2FF' : '#8899BB' }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function EnrollHeader({ step }: { step: number }) {
  const { t } = useT()
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 28 28">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
          </svg>
          <span className="text-xs sm:text-sm font-black tracking-widest" style={{ color: '#F0F4FF' }}>
            {t('edguard_title')} — ENROLLMENT
          </span>
        </div>
        <span className="text-[10px] font-bold tracking-widest" style={{ color: '#00C2FF' }}>
          {t('edguard_step')} {step}/6
        </span>
      </div>
      <div className="h-px w-full my-3" style={{ backgroundColor: '#1E2D45' }} />
      <span className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
        IDENTITY REGISTRATION PROTOCOL
      </span>
    </div>
  )
}

/* ─── Step 1: Student Info ─── */
function Step1({ onNext }: { onNext: () => void }) {
  const { t } = useT()
  const { studentId, institutionId, setStudentInfo } = useEdguardStore()
  const [localStudentId, setLocalStudentId] = useState(studentId)
  const [localInstId, setLocalInstId] = useState(institutionId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!localStudentId.trim() || !localInstId.trim()) return
    setStudentInfo(localStudentId.trim(), localInstId.trim())
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          {t('edguard_student_id')} *
        </label>
        <input
          type="text"
          value={localStudentId}
          onChange={(e) => setLocalStudentId(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:border-[#00C2FF]/50"
          style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45', color: '#F0F4FF' }}
          placeholder="ex: STU-2024-001"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          {t('edguard_institution_id')} *
        </label>
        <input
          type="text"
          value={localInstId}
          onChange={(e) => setLocalInstId(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:border-[#00C2FF]/50"
          style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45', color: '#F0F4FF' }}
          placeholder="ex: UNIV-PARIS-01"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
        style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
      >
        Continuer →
      </button>
    </form>
  )
}

/* ─── Step 2: Official Photo Upload ─── */
function Step2({ onNext }: { onNext: () => void }) {
  const { t } = useT()
  const { officialPhotoB64, setOfficialPhoto } = useEdguardStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setOfficialPhoto(result)
    }
    reader.readAsDataURL(file)
  }, [setOfficialPhoto])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
        {t('edguard_official_photo')} (carte étudiant / CNI)
      </p>
      <p className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>
        La photo doit être nette et le visage visible
      </p>

      {!officialPhotoB64 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-all duration-300"
          style={{
            backgroundColor: '#0A0F1E',
            border: `2px dashed ${dragOver ? '#00C2FF' : '#1E2D45'}`,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8899BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-xs font-semibold tracking-wider" style={{ color: '#8899BB' }}>
            Glisser-déposer ou cliquer
          </span>
          <span className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>
            JPEG, PNG
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid #1E2D45' }}>
          <img src={officialPhotoB64} alt="Official" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 flex items-end justify-end p-3">
            <button
              onClick={() => setOfficialPhoto('')}
              className="text-[10px] font-semibold tracking-wider px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ backgroundColor: 'rgba(10,15,30,0.8)', color: '#8899BB', border: '1px solid #1E2D45' }}
            >
              CHANGER
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!officialPhotoB64}
        className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 disabled:opacity-30"
        style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: officialPhotoB64 ? '0 0 20px rgba(0,194,255,0.3)' : 'none' }}
      >
        Continuer →
      </button>
    </div>
  )
}

/* ─── Step 3: Live Selfie ─── */
function Step3({ onNext }: { onNext: () => void }) {
  const { officialPhotoB64, selfieB64, setSelfie } = useEdguardStore()

  const handleCapture = useCallback((img: string) => {
    setSelfie(img)
  }, [setSelfie])

  const handleRetake = useCallback(() => {
    setSelfie('')
  }, [setSelfie])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
        ALIGNEZ VOTRE VISAGE COMME SUR LA PHOTO OFFICIELLE
      </p>

      {officialPhotoB64 && (
        <div className="flex items-center gap-2 mb-1">
          <img src={officialPhotoB64} alt="Reference" className="w-12 h-12 rounded-lg object-cover" style={{ border: '1px solid #1E2D45' }} />
          <span className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>Photo de référence</span>
        </div>
      )}

      <FaceCapture
        capturedImage={selfieB64}
        onCapture={handleCapture}
        onRetake={handleRetake}
        onProceed={onNext}
      />
    </div>
  )
}

/* ─── Analysis Sequence (reused from Demo) ─── */
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
  }, [lineIdx, ANALYSIS_LINES.length])

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

/* ─── Success Screen ─── */
function SuccessScreen() {
  const { t } = useT()
  const { studentId, institutionId, enrollmentResult, reset } = useEdguardStore()
  if (!enrollmentResult) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4"
    >
      <div className="text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(0,255,136,0.15)', border: '2px solid #00FF88' }}>
          <span className="text-xl" style={{ color: '#00FF88' }}>✓</span>
        </div>
        <p className="text-sm font-bold tracking-widest" style={{ color: '#00FF88' }}>
          {t('edguard_enrolled_success')}
        </p>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

      <div className="space-y-2.5">
        {[
          { label: 'Étudiant', value: studentId },
          { label: 'Établissement', value: institutionId },
          { label: 'Confiance identité', value: `${Math.round(enrollmentResult.identity_confidence)}%` },
          { label: 'Dimensions embedding', value: String(enrollmentResult.embedding_dims) },
          { label: 'Enregistré le', value: new Date(enrollmentResult.enrolled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#8899BB' }}>{item.label}</span>
            <span className="text-xs font-bold tracking-wider" style={{ color: '#F0F4FF' }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

      <div className="space-y-1.5">
        {[
          'Identité biométrique certifiée',
          'Empreinte neurale calibrée',
          'Signé ML-KEM FIPS 203',
        ].map((line) => (
          <div key={line} className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#00C2FF' }}>◈</span>
            <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#F0F4FF' }}>{line}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <button
          onClick={reset}
          className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
          style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF' }}
        >
          Nouvel enrollment
        </button>
        <Link
          to="/edguard/session"
          className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wider text-center transition-all duration-300"
          style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
        >
          Démarrer session
        </Link>
      </div>
    </motion.div>
  )
}

/* ─── Error Screen ─── */
function ErrorScreen({ errorCode, onRetry }: { errorCode: string; onRetry: () => void }) {
  const { t } = useT()
  const messages: Record<string, string> = {
    IDENTITY_MISMATCH: t('edguard_identity_mismatch'),
    EMBEDDING_FAILED: t('edguard_embedding_failed'),
  }
  const message = messages[errorCode] ?? 'Service indisponible. Réessayez.'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-6"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: '2px solid #FF3355', backgroundColor: 'rgba(255,51,85,0.1)' }}>
        <span className="text-xl" style={{ color: '#FF3355' }}>✗</span>
      </div>
      <p className="text-xs font-bold tracking-widest text-center" style={{ color: '#FF3355' }}>ERREUR</p>
      <p className="text-xs text-center max-w-xs" style={{ color: '#8899BB' }}>{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-300"
        style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF' }}
      >
        Réessayer
      </button>
    </motion.div>
  )
}

/* ─── Mobile Required Screen ─── */
function MobileRequiredScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />
      <div className="w-full max-w-md relative">
        <div
          className="rounded-2xl p-7 relative overflow-hidden flex flex-col items-center gap-6"
          style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 28 28">
              <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
            </svg>
            <span className="text-sm font-black tracking-widest" style={{ color: '#F0F4FF' }}>
              EDGUARD
            </span>
          </div>

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,194,255,0.1)', border: '1.5px solid rgba(0,194,255,0.3)' }}
          >
            <span className="text-2xl">📱</span>
          </div>

          {/* Title */}
          <h2 className="text-base font-bold tracking-wider text-center" style={{ color: '#F0F4FF' }}>
            Mobile Required
          </h2>

          {/* Description */}
          <p className="text-xs text-center leading-relaxed max-w-xs" style={{ color: '#8899BB' }}>
            Enrollment must be completed on your mobile device. Biometric sensors required.
          </p>

          <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

          {/* QR Code */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#fff' }}>
            <QRCodeSVG value={ENROLLMENT_URL} size={180} level="M" />
          </div>

          {/* CTA */}
          <p className="text-[10px] font-semibold tracking-widest text-center" style={{ color: '#00C2FF' }}>
            SCAN QR CODE TO CONTINUE →
          </p>

          {/* URL hint */}
          <p className="text-[9px] tracking-wider text-center break-all" style={{ color: '#3D5A75' }}>
            {ENROLLMENT_URL}
          </p>
        </div>

        <p className="text-center text-[10px] mt-4 font-semibold tracking-widest" style={{ color: '#1E2D45' }}>
          POWERED BY HYBRID VECTOR · ML-KEM FIPS 203/204
        </p>
      </div>
    </div>
  )
}

/* ─── Main Enrollment Page ─── */
export function EdguardEnroll() {
  const [step, setStep] = useState<EnrollStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorCode, setErrorCode] = useState('')
  const store = useEdguardStore()

  // Behavioral data collection (same as Demo.tsx)
  const { recordTap, getSnapshot, startScan, stopScan, isMobile } = useSensors()
  const [vocalData, setVocalData] = useState<VocalImportData | null>(null)
  const [reflexResult, setReflexResult] = useState<ReflexResult | null>(null)
  const analysisCalledRef = useRef(false)

  // Start sensor collection when entering selfie step
  useEffect(() => {
    if (step === 3) startScan()
  }, [step, startScan])

  // Step 4: Vocal complete → advance to step 5 (Reflex)
  const handleVocalComplete = useCallback((data: VocalImportData) => {
    setVocalData(data)
    setTimeout(() => setStep(5), 800)
  }, [])

  // Step 5: Reflex complete → advance to analysis
  const handleReflexComplete = useCallback((result: ReflexResult) => {
    setReflexResult(result)
    setTimeout(() => setStep('analysis'), 1000)
  }, [])

  // Analysis done → compute cognitive score & submit enrollment
  const handleAnalysisDone = useCallback(async () => {
    if (analysisCalledRef.current || isSubmitting) return
    analysisCalledRef.current = true
    setIsSubmitting(true)

    stopScan()
    const sensors = getSnapshot()

    // Compute cognitive score exactly like Demo.tsx
    const stroopRounds = vocalData?.rounds.filter((r) => r.isStroop) ?? []
    const stroopCorrectCount = stroopRounds.filter((r) => r.stroopCorrect).length
    const stroopAccuracy = stroopRounds.length > 0 ? stroopCorrectCount / stroopRounds.length : 0
    const mouseScore = sensors.mouseBehavior ? scoreMouseBehavior(sensors.mouseBehavior) : undefined

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
    console.log('[EDGUARD] cognitive score:', { raw: cogScore, normalized: cognitiveScoreOverride, isMobile })

    try {
      const officialB64 = store.officialPhotoB64 ?? ''
      const selfieB64 = store.selfieB64 ?? ''

      if (!officialB64 || !selfieB64) {
        setErrorCode('EMBEDDING_FAILED')
        setStep('error')
        return
      }

      const payload = {
        student_id: store.studentId,
        institution_id: store.institutionId,
        official_photo_b64: officialB64,
        selfie_b64: selfieB64,
        cognitive_score_override: cognitiveScoreOverride,
      }
      const result = await enrollStudent(payload)
      if (result.success && result.enrolled) {
        store.setEnrollmentResult(result)
        setStep('success')
      } else {
        setErrorCode(result.error ?? 'UNKNOWN')
        setStep('error')
      }
    } catch {
      setErrorCode('NETWORK_ERROR')
      setStep('error')
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, store, vocalData, reflexResult, getSnapshot, stopScan, isMobile])

  const handleRetry = useCallback(() => {
    analysisCalledRef.current = false
    setVocalData(null)
    setReflexResult(null)
    setStep(3)
    setErrorCode('')
  }, [])

  const stepNum = typeof step === 'number' ? step : 6

  if (!isMobileDevice) return <MobileRequiredScreen />

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 sm:px-4 overflow-x-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="max-w-2xl mx-auto relative w-full pt-6 sm:pt-8">
        <div className="rounded-2xl p-5 sm:p-7 relative overflow-hidden" style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}>
          {step !== 'success' && step !== 'error' && step !== 'analysis' && (
            <>
              <EnrollHeader step={stepNum} />
              <StepIndicator current={stepNum} />
            </>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <Step1 onNext={() => setStep(2)} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <Step2 onNext={() => setStep(3)} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <Step3 onNext={() => setStep(4)} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <VocalImprint onComplete={handleVocalComplete} />
              </motion.div>
            )}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <NeuralReflex onComplete={handleReflexComplete} />
              </motion.div>
            )}
            {step === 'analysis' && (
              <motion.div key="analysis" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <AnalysisSequence onDone={handleAnalysisDone} />
              </motion.div>
            )}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <SuccessScreen />
              </motion.div>
            )}
            {step === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <ErrorScreen errorCode={errorCode} onRetry={handleRetry} />
              </motion.div>
            )}
          </AnimatePresence>

          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl" style={{ backgroundColor: 'rgba(10,15,30,0.85)' }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#1E2D45] border-t-[#00C2FF] animate-spin" />
                <span className="text-xs font-semibold tracking-widest" style={{ color: '#00C2FF' }}>ENROLLMENT EN COURS...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
