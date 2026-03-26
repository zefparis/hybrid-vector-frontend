import { useState, useRef, useCallback, useEffect, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { FaceCapture } from '@/components/FaceCapture'
import { VocalImprint } from '@/components/VocalImprint'
import { NeuralReflex } from '@/components/NeuralReflex'
import styles from '@/hvguard/theme.module.css'
import { useEdguardStore } from '@/store/edguardStore'
import { useSensors } from '@/hooks/useSensors'
import { computeCognitiveScore, scoreMouseBehavior } from '@/services/api'
import { useT } from '@/i18n/useLang'
import type { VocalImportData, ReflexResult } from '@/types'
// Vitrine-only: l'enroll se fait sur le Guard externe.

const EDGUARD_URL = 'https://edguard-v2.vercel.app'
const ENROLLMENT_URL = `${EDGUARD_URL}/enroll`

const isMobileDevice =
  /Android|iPhone|iPad/i.test(navigator.userAgent) || 'ontouchstart' in window

type EnrollStep = 1 | 2 | 3 | 4 | 5 | 'analysis' | 'success' | 'error'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

function StepIndicator({ current }: { current: number }) {
  const { t } = useT()
  const steps = [
    t('edguard_student_id'),
    t('edguard_selfie'),
    'VOCAL',
    'REFLEX',
    'ANALYSIS',
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
          {t('edguard_step')} {step}/5
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
  const { studentId, institutionId, firstName, lastName, email, role, setStudentInfo, setPersonalInfo } = useEdguardStore()
  const [localStudentId, setLocalStudentId] = useState(studentId)
  const [localInstId, setLocalInstId] = useState(institutionId)
  const [localFirstName, setLocalFirstName] = useState(firstName)
  const [localLastName, setLocalLastName] = useState(lastName)
  const [localEmail, setLocalEmail] = useState(email)
  const [localRole, setLocalRole] = useState(role)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!localStudentId.trim() || !localInstId.trim() || !localFirstName.trim() || !localLastName.trim()) return
    setStudentInfo(localStudentId.trim(), localInstId.trim())
    setPersonalInfo(localFirstName.trim(), localLastName.trim(), localEmail.trim(), localRole)
    onNext()
  }

  const inputStyle = { backgroundColor: '#0A0F1E', border: '1px solid #1E2D45', color: '#F0F4FF' }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>FIRST NAME *</label>
          <input
            type="text" value={localFirstName} onChange={(e) => setLocalFirstName(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
            style={inputStyle} placeholder="John"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>LAST NAME *</label>
          <input
            type="text" value={localLastName} onChange={(e) => setLocalLastName(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
            style={inputStyle} placeholder="Doe"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>EMAIL</label>
        <input
          type="email" value={localEmail} onChange={(e) => setLocalEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
          style={inputStyle} placeholder="john.doe@university.edu"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>ROLE</label>
        <div className="flex gap-2">
          {(['STUDENT', 'TEACHER', 'BENEFICIARY'] as const).map((r) => (
            <button
              key={r} type="button" onClick={() => setLocalRole(r)}
              className="flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-wider transition-all duration-200"
              style={{
                backgroundColor: localRole === r ? 'rgba(0,194,255,0.15)' : 'transparent',
                border: `1.5px solid ${localRole === r ? '#00C2FF' : '#1E2D45'}`,
                color: localRole === r ? '#00C2FF' : '#8899BB',
              }}
            >
              {r === 'STUDENT' ? 'STUDENT' : r === 'TEACHER' ? 'TEACHER' : 'BENEFICIARY'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          {t('edguard_student_id')} *
        </label>
        <input
          type="text" value={localStudentId} onChange={(e) => setLocalStudentId(e.target.value)} required
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
          style={inputStyle} placeholder="ex: STU-2024-001"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          {t('edguard_institution_id')} *
        </label>
        <input
          type="text" value={localInstId} onChange={(e) => setLocalInstId(e.target.value)} required
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
          style={inputStyle} placeholder="ex: UNIV-PARIS-01"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
        style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
      >
        Continue →
      </button>
    </form>
  )
}

/* ─── Step 2: Live Selfie (biometric reference) ─── */
function Step2Selfie({ onNext }: { onNext: () => void }) {
  const { selfieB64, setSelfie } = useEdguardStore()

  const handleCapture = useCallback((img: string) => {
    setSelfie(img)
  }, [setSelfie])

  const handleRetake = useCallback(() => {
    setSelfie('')
  }, [setSelfie])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
        BIOMETRIC CAPTURE — REFERENCE PHOTO
      </p>
      <p className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>
        This selfie will become your recorded biometric identity
      </p>

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
    'AWS REKOGNITION ANALYSIS',
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

/* ─── Neural Metric Row ─── */
function NeuralMetricRow({
  icon, label, value, percent, color, delay, animate,
}: {
  icon: ReactNode; label: string; value: string; percent: number; color: string; delay: number; animate: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: '1px solid rgba(30,45,69,0.5)' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{label}</span>
          <span className="text-[11px] font-bold tracking-wider" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: color,
              width: animate ? `${percent}%` : '0%',
              transition: `width 1s cubic-bezier(0.25,0.46,0.45,0.94) ${delay + 0.3}s`,
              boxShadow: animate ? `0 0 8px ${color}60` : 'none',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Success Screen ─── */
function SuccessScreen() {
  const navigate = useNavigate()
  const store = useEdguardStore()
  const { enrollmentResult } = store
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!enrollmentResult) return null

  const initials = `${(store.firstName[0] ?? '').toUpperCase()}${(store.lastName[0] ?? '').toUpperCase()}` || '??'
  const fullName = `${store.firstName} ${store.lastName}`.trim() || store.studentId
  const roleLabel = store.role === 'STUDENT' ? 'STUDENT' : store.role === 'TEACHER' ? 'TEACHER' : 'BENEFICIARY'
  const faceIdShort = enrollmentResult.faceId?.slice(0, 8).toUpperCase() || '—'

  const facialPct = Math.min(100, Math.round(enrollmentResult.confidence))
  const vocalPct = Math.min(100, Math.round(store.cognitiveScore * 100))
  const reflexPct = store.reflexVelocity > 0 ? Math.min(100, Math.round(Math.max(0, 100 - (store.reflexVelocity - 200) / 8))) : 70
  const stroopPct = Math.min(100, Math.round(store.stroopAccuracy * 100))
  const sensorPct = 75
  const pqcPct = 100

  const overallScore = Math.round((facialPct * 0.25 + vocalPct * 0.2 + reflexPct * 0.15 + stroopPct * 0.2 + sensorPct * 0.1 + pqcPct * 0.1))
  const securityColor = overallScore >= 80 ? '#00FF88' : overallScore >= 60 ? '#00C2FF' : '#FF8800'
  const securityLabel = overallScore >= 80 ? 'MAXIMUM' : overallScore >= 60 ? 'HIGH' : 'STANDARD'

  const CYAN = '#00C2FF'
  const GREEN = '#00FF88'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col gap-5"
    >
      {/* ── 1. Header ── */}
      <div className="text-center pt-2">
        <div className="relative w-16 h-16 mx-auto mb-3">
          <svg viewBox="0 0 56 56" className="w-full h-full">
            <polygon points="28,4 52,16 52,40 28,52 4,40 4,16" fill="none" stroke={CYAN} strokeWidth="2" opacity="0.3" />
            <polygon points="28,8 48,18 48,38 28,48 8,38 8,18" fill="rgba(0,194,255,0.08)" stroke={CYAN} strokeWidth="1.5" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <h2 className="text-sm font-black tracking-[0.2em] mb-1" style={{ color: '#F0F4FF' }}>
          FACE ENROLLED
        </h2>
        <p className="text-[10px] tracking-wider leading-relaxed max-w-xs mx-auto" style={{ color: '#8899BB' }}>
          Face enrolled — ID: {faceIdShort}
        </p>
      </div>

      {/* ── 2. Identity Card ── */}
      <div
        className="rounded-xl p-4 relative overflow-hidden"
        style={{
          backgroundColor: '#0A0F1E',
          border: '1px solid rgba(0,194,255,0.3)',
          boxShadow: '0 0 20px rgba(0,194,255,0.08), inset 0 0 20px rgba(0,194,255,0.03)',
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,255,136,0.1))',
              border: '2px solid rgba(0,194,255,0.4)',
            }}
          >
            <span className="text-sm font-black tracking-wider" style={{ color: CYAN }}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tracking-wider truncate" style={{ color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif" }}>
              {fullName}
            </p>
            <p className="text-[11px] font-bold tracking-widest mt-0.5" style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
              {store.studentId}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] tracking-wider" style={{ color: '#8899BB' }}>{store.institutionId}</span>
              <span
                className="text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(0,194,255,0.12)', border: '1px solid rgba(0,194,255,0.25)', color: CYAN }}
              >
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-3">
          <span className="text-[8px] font-bold tracking-widest" style={{ color: '#3D5A75' }}>
            ID {faceIdShort}
          </span>
        </div>
      </div>

      {/* ── 3. Neural Profile Section ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20h6v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
            <path d="M10 22h4" />
          </svg>
          <span className="text-[10px] font-black tracking-[0.2em]" style={{ color: '#F0F4FF' }}>
            NEURAL IMPRINT
          </span>
        </div>

        <div className="rounded-xl p-3" style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45' }}>
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="4" /><circle cx="12" cy="10" r="3" /><path d="M6 20c0-3 3-5 6-5s6 2 6 5" /></svg>}
            label="AWS REKOGNITION ANALYSIS"
            value={`${facialPct}%`}
            percent={facialPct}
            color={CYAN}
            delay={0}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><path d="M12 1v4m0 14v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M1 12h4m14 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /><circle cx="12" cy="12" r="4" /></svg>}
            label="VOCAL SIGNATURE"
            value={vocalPct > 0 ? 'CALIBRATED' : '—'}
            percent={vocalPct}
            color={CYAN}
            delay={0.1}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
            label="NEURAL VELOCITY"
            value={store.reflexVelocity > 0 ? `${Math.round(store.reflexVelocity)}ms` : 'MEASURED'}
            percent={reflexPct}
            color={CYAN}
            delay={0.2}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8"><path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20h6v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" /><path d="M10 22h4" /></svg>}
            label="TEST STROOP"
            value={stroopPct > 0 ? `${stroopPct}%` : 'VALIDATED'}
            percent={stroopPct || 70}
            color={GREEN}
            delay={0.3}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="3" /><line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" /></svg>}
            label="BEHAVIORAL PROFILE"
            value={isMobileDevice ? 'MOBILE ✓' : 'DESKTOP'}
            percent={sensorPct}
            color={CYAN}
            delay={0.4}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
            label="POST-QUANTUM CRYPTOGRAPHY"
            value="ML-KEM FIPS 203/204"
            percent={pqcPct}
            color={GREEN}
            delay={0.5}
            animate={animate}
          />
        </div>
      </div>

      {/* ── 4. Security Level ── */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: '#8899BB' }}>
            COGNITIVE SECURITY LEVEL
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black" style={{ color: securityColor, fontFamily: "'JetBrains Mono', monospace" }}>
              {overallScore}%
            </span>
            <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${securityColor}18`, border: `1px solid ${securityColor}40`, color: securityColor }}>
              {securityLabel}
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: securityColor,
              width: animate ? `${overallScore}%` : '0%',
              transition: 'width 1.2s cubic-bezier(0.25,0.46,0.45,0.94) 1s',
              boxShadow: animate ? `0 0 12px ${securityColor}60` : 'none',
            }}
          />
        </div>
      </div>

      {/* ── 5. Certifications ── */}
      <div className="flex gap-2">
        {[
          { label: '3 FR Patents', icon: '🇫🇷' },
          { label: 'FIPS 203/204', icon: '🔐' },
          { label: 'Brain ML', icon: '🧠' },
        ].map((cert) => (
          <div
            key={cert.label}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(0,194,255,0.05)', border: '1px solid #1E2D45' }}
          >
            <span className="text-[10px]">{cert.icon}</span>
            <span className="text-[9px] font-bold tracking-widest" style={{ color: '#8899BB' }}>{cert.label}</span>
          </div>
        ))}
      </div>

      {/* ── 6. Actions ── */}
      <div className="flex flex-col gap-2.5 pt-1">
        <Link
          to="/edguard/session"
          className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider text-center transition-all duration-300 block"
          style={{ backgroundColor: CYAN, color: '#0A0F1E', boxShadow: `0 0 24px rgba(0,194,255,0.35)` }}
        >
          Start Session →
        </Link>
        <button
          onClick={() => navigate('/edguard/profile')}
          className="w-full py-3 rounded-xl font-bold text-xs tracking-widest transition-all duration-300"
          style={{ border: '1.5px solid rgba(0,194,255,0.3)', color: CYAN, backgroundColor: 'transparent' }}
        >
          View My Profile
        </button>
      </div>

      {/* ── Footer ── */}
      <p className="text-center text-[9px] tracking-widest pt-1" style={{ color: '#3D5A75' }}>
        POWERED BY HYBRID VECTOR · ML-KEM FIPS 203/204
      </p>
    </motion.div>
  )
}

/* ─── Error Screen ─── */
function ErrorScreen({ errorCode, onRetry }: { errorCode: string; onRetry: () => void }) {
  const { t } = useT()
  const messages: Record<string, string> = {
    IDENTITY_MISMATCH: t('edguard_identity_mismatch'),
    CAPTURE_FAILED: 'Capture failed — please center your face and try again.',
  }
  const message = messages[errorCode] ?? 'Service unavailable. Please try again.'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-6"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: '2px solid #FF3355', backgroundColor: 'rgba(255,51,85,0.1)' }}>
        <span className="text-xl" style={{ color: '#FF3355' }}>✗</span>
      </div>
      <p className="text-xs font-bold tracking-widest text-center" style={{ color: '#FF3355' }}>ERROR</p>
      <p className="text-xs text-center max-w-xs" style={{ color: '#8899BB' }}>{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-300"
        style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF' }}
      >
        Retry
      </button>
    </motion.div>
  )
}

function MobileRequiredScreen() {
  return (
    <div className={styles.app} style={{ background: '#030712' }}>
      <section className={styles.hero} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '6rem', paddingBottom: '3rem' }}>
        <div className={`${styles.heroBackdrop} ${styles.gridBg}`} style={{ opacity: 0.72 }} />
        <div className={styles.heroBackdrop} style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(0,194,255,0.18) 0%, transparent 60%)' }} />
        <div className={styles.heroBackdrop} style={{ backgroundImage: HEX_PATTERN, opacity: 0.45 }} />
        <div className={styles.scanLine} />

        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}
          >
            <div
              className={styles.card}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                background: 'rgba(17,24,39,0.45)',
                borderColor: 'rgba(0,194,255,0.18)',
              }}
            >
              <span className={styles.pulseDot} style={{ background: '#00C2FF', boxShadow: '0 0 12px rgba(0,194,255,0.45)' }} />
              <span style={{ fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: 'rgba(249,250,251,0.9)' }}>
                Mobile enrollment required
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.4rem' }}>
              <div className={styles.card} style={{ width: 72, height: 72, display: 'grid', placeItems: 'center', background: 'rgba(17,24,39,0.55)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12" y2="18.01" />
                </svg>
              </div>
            </div>

            <h1 className={styles.headline} style={{ fontSize: 'clamp(2rem, 7vw, 4rem)', marginTop: '1.2rem' }}>
              Continue enrollment
              <br />
              <span style={{ color: 'var(--cyan)' }}>from your phone.</span>
            </h1>

            <p className={styles.muted} style={{ marginTop: '1rem', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', fontSize: '1rem', lineHeight: 1.75 }}>
              EdGuard enrollment needs a mobile device to capture the live selfie and collect the biometric signals required for the baseline profile.
            </p>

            <div className="grid gap-4 sm:grid-cols-3" style={{ marginTop: '1.75rem' }}>
              {[
                { title: 'Open on mobile', body: 'Use your smartphone browser to access the enrollment link.' },
                { title: 'Capture live selfie', body: 'Follow the guided steps to provide the visual reference sample.' },
                { title: 'Complete the profile', body: 'Finish the biometric setup before verification or exam monitoring.' },
              ].map((item) => (
                <div key={item.title} className={styles.card} style={{ background: 'rgba(17,24,39,0.5)', textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7DDFFF' }}>
                    {item.title}
                  </div>
                  <div className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {item.body}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.card} style={{ marginTop: '1.5rem', background: 'rgba(17,24,39,0.52)' }}>
              <p className={styles.mono} style={{ margin: 0, color: '#00C2FF', fontWeight: 800, letterSpacing: '0.16em', fontSize: 11, textTransform: 'uppercase' }}>
                Open this page from your smartphone to continue.
              </p>
              <p className={styles.muted} style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.8125rem', wordBreak: 'break-all' }}>
                {ENROLLMENT_URL}
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

/* ─── Main Enrollment Page ─── */
export function EdguardEnroll() {
  const navigate = useNavigate()
  const store = useEdguardStore()

  const [step, setStep] = useState<1 | 2 | 'success' | 'error'>(1)
  const [firstName, setFirstName] = useState(store.firstName)
  const [lastName, setLastName] = useState(store.lastName)
  const [email, setEmail] = useState(store.email)
  const [selfieB64, setSelfieB64] = useState(store.selfieB64 ?? '')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tenantId = 'demo-tenant'

  const handleIdentitySubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    store.setPersonalInfo(firstName.trim(), lastName.trim(), email.trim(), store.role)
    setStep(2)
  }, [email, firstName, lastName, store])

  const handleCapture = useCallback((img: string) => {
    setSelfieB64(img)
  }, [])

  const handleRetake = useCallback(() => {
    setSelfieB64('')
  }, [])

  const handleEnroll = useCallback(async () => {
    // Vitrine-only: pas d'appel API. On bascule vers le Guard externe.
    // On garde quand même la capture et les champs locaux pour l'UI.
    setIsSubmitting(true)
    window.location.href = `${EDGUARD_URL}/enroll`
  }, [])

  const handleRetry = useCallback(() => {
    setErrorMsg('')
    setStep(2)
  }, [])

  const handleReset = useCallback(() => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setSelfieB64('')
    setErrorMsg('')
    setStep(1)
  }, [])

  const confidence = Math.round(store.enrollmentResult?.confidence ?? 0)
  const currentStepNumber = step === 1 ? 1 : step === 2 ? 2 : 5
  const infoCards = [
    {
      title: 'Enrollment flow',
      body: 'Collect student identity details, capture a live reference selfie, and create the baseline profile used for future checks.',
    },
    {
      title: 'Mobile-ready capture',
      body: 'The capture flow is optimized for phone browsers and quick onboarding before exam day.',
    },
    {
      title: 'Secure output',
      body: 'Successful enrollment stores the face profile and trust signals required before verification and session access.',
    },
  ]

  return (
    <div className={styles.app} style={{ background: '#030712' }}>
      <section className={styles.hero} style={{ minHeight: 'auto', paddingBottom: '3rem' }}>
        <div className={`${styles.heroBackdrop} ${styles.gridBg}`} style={{ opacity: 0.72 }} />
        <div className={styles.heroBackdrop} style={{ background: 'radial-gradient(ellipse at 50% 18%, rgba(0,194,255,0.16) 0%, transparent 58%)' }} />
        <div className={styles.heroBackdrop} style={{ backgroundImage: HEX_PATTERN, opacity: 0.5 }} />
        <div className={styles.scanLine} />

        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}
          >
            <div
              className={styles.card}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                background: 'rgba(17,24,39,0.45)',
                borderColor: 'rgba(0,194,255,0.18)',
              }}
            >
              <span className={styles.pulseDot} style={{ background: '#00C2FF', boxShadow: '0 0 12px rgba(0,194,255,0.45)' }} />
              <span style={{ fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: 'rgba(249,250,251,0.9)' }}>
                Student identity enrollment
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '1.25rem' }}>
              <svg width="42" height="42" viewBox="0 0 28 28">
                <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="4" fill="#00C2FF" opacity="0.45" />
              </svg>
              <span className={styles.mono} style={{ color: '#00C2FF', fontWeight: 800, letterSpacing: '0.24em', fontSize: 14 }}>
                EDGUARD ENROLL
              </span>
            </div>

            <h1 className={styles.headline} style={{ fontSize: 'clamp(2.15rem, 8vw, 4.8rem)', marginTop: '1rem' }}>
              Build the student
              <br />
              <span style={{ color: 'var(--cyan)' }}>identity profile.</span>
            </h1>

            <p className={styles.muted} style={{ marginTop: '1rem', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto', fontSize: 'clamp(0.95rem, 2.5vw, 1.06rem)', lineHeight: 1.7 }}>
              Enroll each student with identity details and a live selfie capture so verification and monitored session access stay fast, clear, and consistent.
            </p>

            <div className={styles.statsGrid}>
              {[
                { value: '2 steps', label: 'Identity + capture' },
                { value: 'Live', label: 'Selfie reference creation' },
                { value: 'Secure', label: 'Baseline profile output' },
                { value: `${confidence || 0}%`, label: 'Latest confidence score' },
              ].map((item) => (
                <div key={item.label} className={styles.card} style={{ textAlign: 'left', background: 'rgba(17,24,39,0.55)' }}>
                  <div className={styles.mono} style={{ fontSize: 'clamp(1.2rem, 4vw, 1.65rem)', fontWeight: 800, color: 'var(--cyan)' }}>
                    {item.value}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 6, fontSize: '0.8125rem' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="edguardEnrollLayout" style={{ marginTop: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className={styles.card} style={{ background: 'rgba(17,24,39,0.58)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7DDFFF' }}>
                      Active flow
                    </div>
                    <div style={{ marginTop: 6, fontFamily: '"Syne", system-ui, sans-serif', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1, color: '#F9FAFB' }}>
                      {step === 1 ? 'Identity details' : step === 2 ? 'Live selfie capture' : step === 'success' ? 'Enrollment complete' : 'Enrollment issue'}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8899BB' }}>
                    Step {currentStepNumber}/5
                  </span>
                </div>

                <StepIndicator current={currentStepNumber} />

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="enroll-id" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(0,194,255,0.1)', border: '1.5px solid rgba(0,194,255,0.3)' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <h2 className="text-base font-bold tracking-wider mb-1" style={{ color: '#F0F4FF' }}>
                          Identity Enrollment
                        </h2>
                        <p className="text-xs" style={{ color: '#8899BB' }}>
                          Enter the student identity details before capture starts
                        </p>
                      </div>

                      <form onSubmit={handleIdentitySubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>FIRST NAME *</label>
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              autoFocus
                              placeholder="John"
                              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                              style={{ backgroundColor: 'rgba(3,7,18,0.78)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F4FF' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>LAST NAME *</label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                              placeholder="Doe"
                              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                              style={{ backgroundColor: 'rgba(3,7,18,0.78)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F4FF' }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>EMAIL</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.doe@university.edu"
                            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                            style={{ backgroundColor: 'rgba(3,7,18,0.78)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F4FF' }}
                          />
                        </div>

                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          style={{ width: '100%' }}
                        >
                          Continue →
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="enroll-face" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                      <div className="text-center mb-4">
                        <h2 className="text-base font-bold tracking-wider mb-1" style={{ color: '#F0F4FF' }}>
                          Selfie Capture
                        </h2>
                        <p className="text-xs" style={{ color: '#8899BB' }}>
                          Center the face inside the frame and capture one clean reference image
                        </p>
                      </div>

                      <FaceCapture
                        capturedImage={selfieB64}
                        onCapture={handleCapture}
                        onRetake={handleRetake}
                        onProceed={handleEnroll}
                        proceedLabel="Enroll Me"
                      />

                      <button
                        onClick={handleReset}
                        className="w-full mt-3 text-[10px] font-semibold tracking-wider py-2"
                        style={{ color: '#3D5A75' }}
                      >
                        ← Edit identity
                      </button>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div key="enroll-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, delay: 0.05 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,255,136,0.15)', border: '2px solid #00FF88', boxShadow: '0 0 30px rgba(0,255,136,0.3)' }}
                      >
                        <span className="text-3xl" style={{ color: '#00FF88' }}>✓</span>
                      </motion.div>

                      <div className="text-center">
                        <p className="text-sm font-bold tracking-widest mb-1" style={{ color: '#00FF88' }}>
                          ✅ Identity enrolled
                        </p>
                        <p className="text-xs mb-3" style={{ color: '#8899BB' }}>
                          {firstName.trim()}
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                          <span className="text-[10px] font-bold tracking-widest" style={{ color: '#00FF88' }}>
                            CONFIDENCE
                          </span>
                          <span className="text-sm font-black" style={{ color: '#00FF88', fontFamily: 'monospace' }}>
                            {confidence}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/edguard/verify')}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ width: '100%' }}
                      >
                        Go to Verification →
                      </button>
                    </motion.div>
                  )}

                  {step === 'error' && (
                    <motion.div key="enroll-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-6">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,51,85,0.1)', border: '2px solid #FF3355' }}>
                        <span className="text-3xl" style={{ color: '#FF3355' }}>✗</span>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-bold tracking-widest mb-2" style={{ color: '#FF3355' }}>
                          ENROLLMENT FAILED
                        </p>
                        <p className="text-xs max-w-xs" style={{ color: '#8899BB' }}>
                          {errorMsg}
                        </p>
                      </div>

                      <div className="flex gap-3 w-full">
                        <button
                          onClick={handleRetry}
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          style={{ flex: 1 }}
                        >
                          Retry
                        </button>
                        <button
                          onClick={handleReset}
                          className={`${styles.btn} ${styles.btnOutline}`}
                          style={{ flex: 1 }}
                        >
                          Start Over
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl" style={{ backgroundColor: 'rgba(3,7,18,0.86)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#00C2FF] animate-spin" />
                      <span className="text-xs font-semibold tracking-widest" style={{ color: '#00C2FF' }}>ENROLLMENT IN PROGRESS...</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {infoCards.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + idx * 0.08, duration: 0.45 }}
                  className={styles.card}
                  style={{ background: 'rgba(17,24,39,0.45)' }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7DDFFF' }}>
                    {item.title}
                  </div>
                  <div className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {item.body}
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
                className={styles.card}
                style={{ background: 'rgba(17,24,39,0.45)' }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7DDFFF' }}>
                  Output checkpoints
                </div>
                <div style={{ display: 'grid', gap: 10, marginTop: '0.9rem' }}>
                  {['Identity details validated', 'Reference selfie captured', 'Ready for verification flow'].map((point) => (
                    <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#E5EEF9', fontSize: '0.875rem', lineHeight: 1.5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: '#00C2FF', flexShrink: 0 }} />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <style>{`
          .edguardEnrollLayout {
            display: grid;
            grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
            gap: 1rem;
            align-items: start;
          }

          @media (max-width: 960px) {
            .edguardEnrollLayout {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    </div>
  )
}
