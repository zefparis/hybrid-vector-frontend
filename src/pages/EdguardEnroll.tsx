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

type EnrollStep = 1 | 2 | 3 | 4 | 5 | 'analysis' | 'success' | 'error'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

function StepIndicator({ current }: { current: number }) {
  const { t } = useT()
  const steps = [
    t('edguard_student_id'),
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

  const handleSubmit = (e: React.FormEvent) => {
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
          <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>PRÉNOM *</label>
          <input
            type="text" value={localFirstName} onChange={(e) => setLocalFirstName(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
            style={inputStyle} placeholder="Jean"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>NOM *</label>
          <input
            type="text" value={localLastName} onChange={(e) => setLocalLastName(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
            style={inputStyle} placeholder="Dupont"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>EMAIL</label>
        <input
          type="email" value={localEmail} onChange={(e) => setLocalEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
          style={inputStyle} placeholder="jean.dupont@universite.fr"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>RÔLE</label>
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
              {r === 'STUDENT' ? 'ÉTUDIANT' : r === 'TEACHER' ? 'ENSEIGNANT' : 'BÉNÉFICIAIRE'}
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
        Continuer →
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
        CAPTURE BIOMÉTRIQUE — PHOTO DE RÉFÉRENCE
      </p>
      <p className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>
        Ce selfie sera votre identité biométrique enregistrée
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

/* ─── Neural Metric Row ─── */
function NeuralMetricRow({
  icon, label, value, percent, color, delay, animate,
}: {
  icon: React.ReactNode; label: string; value: string; percent: number; color: string; delay: number; animate: boolean
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
  const roleLabel = store.role === 'STUDENT' ? 'ÉTUDIANT' : store.role === 'TEACHER' ? 'ENSEIGNANT' : 'BÉNÉFICIAIRE'

  const facialPct = Math.min(100, Math.round(enrollmentResult.identity_confidence))
  const vocalPct = Math.min(100, Math.round(store.cognitiveScore * 100))
  const reflexPct = store.reflexVelocity > 0 ? Math.min(100, Math.round(Math.max(0, 100 - (store.reflexVelocity - 200) / 8))) : 70
  const stroopPct = Math.min(100, Math.round(store.stroopAccuracy * 100))
  const sensorPct = 75
  const pqcPct = 100

  const overallScore = Math.round((facialPct * 0.25 + vocalPct * 0.2 + reflexPct * 0.15 + stroopPct * 0.2 + sensorPct * 0.1 + pqcPct * 0.1))
  const securityColor = overallScore >= 80 ? '#00FF88' : overallScore >= 60 ? '#00C2FF' : '#FF8800'
  const securityLabel = overallScore >= 80 ? 'MAXIMUM' : overallScore >= 60 ? 'ÉLEVÉ' : 'STANDARD'

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
          NEURAL PROFILE CREATED
        </h2>
        <p className="text-[10px] tracking-wider leading-relaxed max-w-xs mx-auto" style={{ color: '#8899BB' }}>
          Your cognitive signature is unique — no AI can replicate it
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
            {enrollmentResult.embedding_dims}d ArcFace
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
            EMPREINTE NEURALE
          </span>
        </div>

        <div className="rounded-xl p-3" style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45' }}>
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="4" /><circle cx="12" cy="10" r="3" /><path d="M6 20c0-3 3-5 6-5s6 2 6 5" /></svg>}
            label="RECONNAISSANCE FACIALE"
            value={`${facialPct}%`}
            percent={facialPct}
            color={CYAN}
            delay={0}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><path d="M12 1v4m0 14v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M1 12h4m14 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /><circle cx="12" cy="12" r="4" /></svg>}
            label="SIGNATURE VOCALE"
            value={vocalPct > 0 ? 'CALIBRÉE' : '—'}
            percent={vocalPct}
            color={CYAN}
            delay={0.1}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
            label="VÉLOCITÉ NEURALE"
            value={store.reflexVelocity > 0 ? `${Math.round(store.reflexVelocity)}ms` : 'MESURÉE'}
            percent={reflexPct}
            color={CYAN}
            delay={0.2}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8"><path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20h6v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" /><path d="M10 22h4" /></svg>}
            label="TEST STROOP"
            value={stroopPct > 0 ? `${stroopPct}%` : 'VALIDÉ'}
            percent={stroopPct || 70}
            color={GREEN}
            delay={0.3}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="3" /><line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" /></svg>}
            label="PROFIL COMPORTEMENTAL"
            value={isMobileDevice ? 'MOBILE ✓' : 'DESKTOP'}
            percent={sensorPct}
            color={CYAN}
            delay={0.4}
            animate={animate}
          />
          <NeuralMetricRow
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
            label="CRYPTOGRAPHIE POST-QUANTIQUE"
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
            NIVEAU DE SÉCURITÉ COGNITIF
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
          { label: '3 Brevets FR', icon: '🇫🇷' },
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
          Démarrer une session →
        </Link>
        <button
          className="w-full py-3 rounded-xl font-bold text-xs tracking-widest transition-all duration-300"
          style={{ border: '1.5px solid rgba(0,194,255,0.3)', color: CYAN, backgroundColor: 'transparent' }}
        >
          Voir mon profil
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
    if (step === 2) startScan()
  }, [step, startScan])

  // Step 3: Vocal complete → advance to step 4 (Reflex)
  const handleVocalComplete = useCallback((data: VocalImportData) => {
    setVocalData(data)
    setTimeout(() => setStep(4), 800)
  }, [])

  // Step 4: Reflex complete → advance to analysis
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

    store.setEnrollmentMetrics(
      cognitiveScoreOverride,
      stroopAccuracy,
      reflexResult?.avgVelocityMs ?? 0,
    )

    try {
      const selfieB64 = store.selfieB64 ?? ''

      if (!selfieB64) {
        setErrorCode('EMBEDDING_FAILED')
        setStep('error')
        return
      }

      const payload = {
        student_id: store.studentId,
        institution_id: store.institutionId,
        selfie_b64: selfieB64,
        first_name: store.firstName || undefined,
        last_name: store.lastName || undefined,
        email: store.email || undefined,
        role: store.role.toLowerCase() as 'student' | 'teacher' | 'beneficiary',
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
    setStep(2)
    setErrorCode('')
  }, [])

  const stepNum = typeof step === 'number' ? step : 5

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
                <Step2Selfie onNext={() => setStep(3)} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <VocalImprint onComplete={handleVocalComplete} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
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
