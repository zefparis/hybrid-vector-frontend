import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaceCapture } from '@/components/FaceCapture'
import { useEdguardStore } from '@/store/edguardStore'
import { enrollStudent } from '@/services/edguardApi'
import { useT } from '@/i18n/useLang'

type EnrollStep = 1 | 2 | 3 | 4 | 'success' | 'error'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

/* ─── Stroop mini colors ─── */
const STROOP_ITEMS: Array<{ word: string; color: string; correctAnswer: string }> = [
  { word: 'ROUGE', color: '#00C2FF', correctAnswer: 'bleu' },
  { word: 'VERT', color: '#FF3355', correctAnswer: 'rouge' },
  { word: 'BLEU', color: '#00FF88', correctAnswer: 'vert' },
]

function StepIndicator({ current }: { current: number }) {
  const { t } = useT()
  const steps = [
    t('edguard_student_id'),
    t('edguard_official_photo'),
    t('edguard_selfie'),
    t('edguard_cognitive'),
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
          {t('edguard_step')} {step}/4
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

/* ─── Step 4: Cognitive Baseline ─── */
function Step4({ onSkip, onComplete }: { onSkip: () => void; onComplete: (stroop: number, reaction: number) => void }) {
  const { t } = useT()
  const [phase, setPhase] = useState<'intro' | 'reaction' | 'stroop' | 'done'>('intro')
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [reactionStep, setReactionStep] = useState(0)
  const [showCircle, setShowCircle] = useState(false)
  const circleShownAt = useRef(0)
  const [stroopStep, setStroopStep] = useState(0)
  const [stroopCorrect, setStroopCorrect] = useState(0)
  const reactionTotal = 5
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reaction time test
  useEffect(() => {
    if (phase !== 'reaction' || reactionStep >= reactionTotal) return
    const delay = 1500 + Math.random() * 2500
    timeoutRef.current = setTimeout(() => {
      setShowCircle(true)
      circleShownAt.current = performance.now()
    }, delay)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [phase, reactionStep])

  const handleReactionClick = useCallback(() => {
    if (!showCircle) return
    const rt = Math.round(performance.now() - circleShownAt.current)
    setReactionTimes((prev) => [...prev, rt])
    setShowCircle(false)
    const next = reactionStep + 1
    setReactionStep(next)
    if (next >= reactionTotal) {
      setTimeout(() => setPhase('stroop'), 600)
    }
  }, [showCircle, reactionStep])

  // Stroop
  const handleStroopAnswer = useCallback((correct: boolean) => {
    if (correct) setStroopCorrect((c) => c + 1)
    const next = stroopStep + 1
    setStroopStep(next)
    if (next >= STROOP_ITEMS.length) {
      setPhase('done')
    }
  }, [stroopStep])

  useEffect(() => {
    if (phase !== 'done') return
    const avgRt = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0
    const stroopScore = Math.round((stroopCorrect / STROOP_ITEMS.length) * 100)
    const timer = setTimeout(() => onComplete(stroopScore, avgRt), 800)
    return () => clearTimeout(timer)
  }, [phase, reactionTimes, stroopCorrect, onComplete])

  if (phase === 'intro') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs font-bold tracking-widest" style={{ color: '#00C2FF' }}>
          {t('edguard_cognitive')}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#8899BB' }}>
          Ces données servent de référence pour détecter les anomalies cognitives pendant les examens.
        </p>
        <button
          onClick={() => setPhase('reaction')}
          className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
          style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
        >
          Commencer la calibration →
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2 text-xs font-semibold tracking-wider transition-all duration-200"
          style={{ color: '#8899BB' }}
        >
          {t('edguard_skip')}
        </button>
      </div>
    )
  }

  if (phase === 'reaction') {
    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          TEMPS DE RÉACTION — {reactionStep}/{reactionTotal}
        </p>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: '#00C2FF', width: `${(reactionStep / reactionTotal) * 100}%` }} />
        </div>
        <div
          onClick={handleReactionClick}
          className="w-48 h-48 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 touch-manipulation"
          style={{
            backgroundColor: showCircle ? '#00FF88' : '#0A0F1E',
            border: `2px solid ${showCircle ? '#00FF88' : '#1E2D45'}`,
            boxShadow: showCircle ? '0 0 40px rgba(0,255,136,0.4)' : 'none',
          }}
        >
          <span className="text-xs font-bold tracking-widest" style={{ color: showCircle ? '#0A0F1E' : '#8899BB' }}>
            {showCircle ? 'CLIQUEZ !' : 'ATTENDEZ...'}
          </span>
        </div>
      </div>
    )
  }

  if (phase === 'stroop') {
    const item = STROOP_ITEMS[stroopStep]
    if (!item) return null
    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          TEST STROOP — {stroopStep + 1}/{STROOP_ITEMS.length}
        </p>
        <p className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>
          Dites la COULEUR de l&apos;encre, pas le mot
        </p>
        <div className="py-8">
          <span className="text-4xl font-black tracking-widest" style={{ color: item.color }}>
            {item.word}
          </span>
        </div>
        <div className="flex gap-3">
          {['rouge', 'bleu', 'vert'].map((c) => {
            const colorMap: Record<string, string> = { rouge: '#FF3355', bleu: '#00C2FF', vert: '#00FF88' }
            return (
              <button
                key={c}
                onClick={() => handleStroopAnswer(c === item.correctAnswer)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 touch-manipulation"
                style={{ border: `1.5px solid ${colorMap[c]}`, color: colorMap[c] }}
              >
                {c.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // done
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,255,136,0.15)', border: '1.5px solid #00FF88' }}>
        <span style={{ color: '#00FF88' }}>✓</span>
      </div>
      <p className="text-xs font-bold tracking-widest" style={{ color: '#00FF88' }}>CALIBRATION TERMINÉE</p>
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

/* ─── Main Enrollment Page ─── */
export function EdguardEnroll() {
  const [step, setStep] = useState<EnrollStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorCode, setErrorCode] = useState('')
  const store = useEdguardStore()

  const submitEnrollment = useCallback(async (stroopScore?: number, reactionTime?: number) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const payload = {
        student_id: store.studentId,
        institution_id: store.institutionId,
        official_photo_b64: store.officialPhotoB64 ?? '',
        selfie_b64: store.selfieB64 ?? '',
        cognitive_baseline: stroopScore != null && reactionTime != null
          ? { stroop_score: stroopScore, reaction_time_ms: reactionTime, nback_score: 0 }
          : undefined,
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
  }, [isSubmitting, store])

  const handleStep4Complete = useCallback((stroopScore: number, reactionTime: number) => {
    submitEnrollment(stroopScore, reactionTime)
  }, [submitEnrollment])

  const handleStep4Skip = useCallback(() => {
    submitEnrollment()
  }, [submitEnrollment])

  const handleRetry = useCallback(() => {
    setStep(3)
    setErrorCode('')
  }, [])

  const stepNum = typeof step === 'number' ? step : 1

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 sm:px-4 overflow-x-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="max-w-2xl mx-auto relative w-full pt-6 sm:pt-8">
        <div className="rounded-2xl p-5 sm:p-7 relative overflow-hidden" style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}>
          {step !== 'success' && step !== 'error' && (
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
                <Step4 onSkip={handleStep4Skip} onComplete={handleStep4Complete} />
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
