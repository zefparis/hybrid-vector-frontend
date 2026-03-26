import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Webcam from 'react-webcam'
import styles from '@/hvguard/theme.module.css'
import { useEdguardStore } from '@/store/edguardStore'
import type { CheckpointResponse } from '@/services/edguardApi'
import { useT } from '@/i18n/useLang'

const EDGUARD_URL = 'https://edguard-v2.vercel.app'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

const CHECKPOINT_INTERVAL_MS = 5 * 60 * 1000
const VIDEO_CONSTRAINTS = { width: 320, height: 240, facingMode: 'user' as const }

function alertColor(level: string): string {
  if (level === 'CLEAR') return '#00FF88'
  if (level === 'WARNING') return '#FF8C00'
  return '#FF3355'
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ─── Mini Reaction Test (3 stimuli, overlay) ─── */
function MiniReactionTest({ onDone }: { onDone: (avgMs: number) => void }) {
  const { t } = useT()
  const [step, setStep] = useState(0)
  const [showCircle, setShowCircle] = useState(false)
  const circleAt = useRef(0)
  const times = useRef<number[]>([])
  const total = 3
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (step >= total) {
      const avg = times.current.length > 0
        ? Math.round(times.current.reduce((a, b) => a + b, 0) / times.current.length)
        : 500
      const t = setTimeout(() => onDone(avg), 400)
      return () => clearTimeout(t)
    }
    const delay = 800 + Math.random() * 1500
    timeoutRef.current = setTimeout(() => {
      setShowCircle(true)
      circleAt.current = performance.now()
    }, delay)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [step, onDone])

  const handleClick = useCallback(() => {
    if (!showCircle) return
    times.current.push(Math.round(performance.now() - circleAt.current))
    setShowCircle(false)
    setStep((s) => s + 1)
  }, [showCircle])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-2xl"
      style={{ backgroundColor: 'rgba(10,15,30,0.92)' }}
    >
      <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
        {t('session_checkpoint_cognitive').replace('{step}', String(step)).replace('{total}', String(total))}
      </p>
      <div
        onClick={handleClick}
        className="w-28 h-28 rounded-full flex items-center justify-center cursor-pointer touch-manipulation transition-all duration-200"
        style={{
          backgroundColor: showCircle ? '#00FF88' : '#0A0F1E',
          border: `2px solid ${showCircle ? '#00FF88' : '#1E2D45'}`,
          boxShadow: showCircle ? '0 0 30px rgba(0,255,136,0.4)' : 'none',
        }}
      >
        <span className="text-[10px] font-bold tracking-widest" style={{ color: showCircle ? '#0A0F1E' : '#8899BB' }}>
          {showCircle ? t('session_tap') : t('session_wait')}
        </span>
      </div>
    </motion.div>
  )
}

/* ─── Checkpoint History Item ─── */
function CheckpointItem({ cp }: { cp: CheckpointResponse }) {
  const { t } = useT()
  const color = alertColor(cp.alert_level)
  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-5">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#F0F4FF' }}>
            {t('edguard_checkpoint')} #{cp.checkpoint_number}
          </span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color }}>
            {cp.trust_score}%
          </span>
        </div>
        <span className="text-[9px] tracking-wider" style={{ color: '#8899BB' }}>
          {new Date(cp.timestamp).toLocaleTimeString('en-US')}
        </span>
      </div>
      <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
        {cp.alert_level}
      </span>
    </div>
  )
}

/* ─── Session Setup ─── */
function SessionSetup({ onStart }: { onStart: (studentId: string, examName: string) => void }) {
  const { t } = useT()
  const { studentId } = useEdguardStore()
  const [localStudentId, setLocalStudentId] = useState(studentId)
  const [examName, setExamName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!localStudentId.trim()) return
    onStart(localStudentId.trim(), examName.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <p className="text-xs font-bold tracking-widest" style={{ color: '#00C2FF' }}>
          SESSION SETUP
        </p>
        <div className="h-px w-full mt-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </div>

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
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
          {t('session_exam_name_optional')}
        </label>
        <input
          type="text"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:border-[#00C2FF]/50"
          style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45', color: '#F0F4FF' }}
          placeholder={t('session_exam_placeholder')}
        />
      </div>

      <button
        type="submit"
        className={`${styles.btn} ${styles.btnPrimary}`}
        style={{ width: '100%' }}
      >
        {t('session_continue')}
      </button>
    </form>
  )
}

/* ─── Session Summary ─── */
function SessionSummary({ checkpoints, duration }: { checkpoints: CheckpointResponse[]; duration: number }) {
  const { t } = useT()
  const avgScore = checkpoints.length > 0
    ? Math.round(checkpoints.reduce((s, c) => s + c.trust_score, 0) / checkpoints.length)
    : 0
  const alertCount = checkpoints.filter((c) => c.alert_level === 'ALERT').length
  const verdict = alertCount === 0 && avgScore >= 70 ? 'CLEARED' : alertCount > 0 ? 'SUSPECT' : 'WARNING'
  const verdictColor = verdict === 'CLEARED' ? '#00FF88' : verdict === 'SUSPECT' ? '#FF3355' : '#FF8C00'

  const handleExport = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>${t('session_report_title')}</title>
      <style>body{font-family:Inter,sans-serif;background:#0A0F1E;color:#F0F4FF;padding:40px}
      h1{color:#00C2FF;letter-spacing:3px}table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{padding:8px 12px;border:1px solid #1E2D45;text-align:left;font-size:12px}
      th{background:#0D1526;color:#00C2FF;letter-spacing:2px}</style></head><body>
      <h1>${t('session_report_title')}</h1>
      <p>${t('session_report_duration')}: ${formatDuration(duration)} | ${t('session_report_checkpoints')}: ${checkpoints.length} | ${t('session_report_average')}: ${avgScore}% | ${t('session_report_alerts')}: ${alertCount}</p>
      <table><tr><th>#</th><th>${t('session_report_time')}</th><th>${t('session_report_score')}</th><th>${t('session_report_status')}</th><th>${t('session_report_flags')}</th></tr>
      ${checkpoints.map((c) => `<tr><td>${c.checkpoint_number}</td><td>${new Date(c.timestamp).toLocaleTimeString('en-US')}</td><td>${c.trust_score}%</td><td>${c.alert_level}</td><td>${c.flags.join(', ') || '—'}</td></tr>`).join('')}
      </table></body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-sm font-bold tracking-widest" style={{ color: verdictColor }}>{verdict}</p>
        <p className="text-[10px] tracking-wider mt-1" style={{ color: '#8899BB' }}>{t('session_terminated').toUpperCase()}</p>
      </div>
      <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t('session_duration'), value: formatDuration(duration) },
          { label: t('session_checkpoints'), value: String(checkpoints.length) },
          { label: t('session_average_score'), value: `${avgScore}%` },
          { label: t('session_alerts'), value: String(alertCount) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45' }}>
            <p className="text-lg font-bold" style={{ color: '#F0F4FF' }}>{s.value}</p>
            <p className="text-[9px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {checkpoints.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45' }}>
          <p className="text-[10px] font-semibold tracking-widest mb-3" style={{ color: '#8899BB' }}>{t('session_timeline').toUpperCase()}</p>
          <div className="flex items-end gap-1 h-20">
            {checkpoints.map((cp) => {
              const h = Math.max(8, (cp.trust_score / 100) * 80)
              return (
                <div key={cp.checkpoint_number} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm" style={{ height: h, backgroundColor: alertColor(cp.alert_level) }} />
                  <span className="text-[8px]" style={{ color: '#8899BB' }}>{cp.checkpoint_number}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        className={`${styles.btn} ${styles.btnOutline}`}
        style={{ width: '100%' }}
      >
        {t('edguard_export_pdf')}
      </button>
    </motion.div>
  )
}

/* ─── Main Session Page ─── */
export function EdguardSession() {
  const { t } = useT()
  const store = useEdguardStore()
  const webcamRef = useRef<Webcam>(null)
  const checkpointTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [phase, setPhase] = useState<'setup' | 'active' | 'checkpoint' | 'summary'>('setup')
  const [elapsed, setElapsed] = useState(0)
  const [examName, setExamName] = useState('')
  const [pulseColor, setPulseColor] = useState<string | null>(null)
  const [runningCheckpoint, setRunningCheckpoint] = useState(false)

  useEffect(() => {
    // Vitrine-only: pas de collecteurs ni de backend.
  }, [])

  // Elapsed timer
  useEffect(() => {
    if (!store.sessionActive) return
    const timer = setInterval(() => {
      if (store.sessionStartTime) setElapsed(Date.now() - store.sessionStartTime)
    }, 1000)
    return () => clearInterval(timer)
  }, [store.sessionActive, store.sessionStartTime])

  // Auto checkpoint every 5 min
  useEffect(() => {
    if (!store.sessionActive) return
    checkpointTimerRef.current = setInterval(() => {
      setPhase('checkpoint')
    }, CHECKPOINT_INTERVAL_MS)
    return () => {
      if (checkpointTimerRef.current) clearInterval(checkpointTimerRef.current)
    }
  }, [store.sessionActive])

  const handleStart = useCallback((studentId: string, exam: string) => {
    store.setStudentInfo(studentId, store.institutionId)
    store.startSession()
    setExamName(exam)
    setPhase('active')
  }, [store])

  const runCheckpoint = useCallback(async (cognitiveMs: number) => {
    if (runningCheckpoint) return
    setRunningCheckpoint(true)
    setPhase('active')

    const frame = webcamRef.current?.getScreenshot() ?? ''
    const cogScore = Math.max(0, Math.min(100, Math.round(100 - (cognitiveMs / 10))))

    // Vitrine-only: plus de checkpoint backend.
    // On redirige vers le Guard externe pour le mode session réel.
    window.location.href = `${EDGUARD_URL}/session`
    // fallback UI: pseudo-checkpoint local
    const simulated: CheckpointResponse = {
      success: true,
      session_id: store.sessionId,
      student_id: store.studentId,
      checkpoint_number: store.checkpointNumber + 1,
      trust_score: Math.max(0, Math.min(100, Math.round(50 + cogScore * 0.5))),
      alert_level: cogScore >= 70 ? 'CLEAR' : cogScore >= 55 ? 'WARNING' : 'ALERT',
      verified: cogScore >= 55,
      liveness: Boolean(frame),
      cognitive_deviation: 0,
      flags: ['OFFLINE_VITRINE_MODE'],
      timestamp: new Date().toISOString(),
    }
    store.addCheckpoint(simulated)
    setPulseColor(alertColor(simulated.alert_level))
    setTimeout(() => setPulseColor(null), 2000)
    setRunningCheckpoint(false)
  }, [runningCheckpoint, store])

  const handleEnd = useCallback(() => {
    store.endSession()
    if (checkpointTimerRef.current) clearInterval(checkpointTimerRef.current)
    setPhase('summary')
  }, [store])

  const handleManualCheckpoint = useCallback(() => {
    setPhase('checkpoint')
  }, [])

  const averageTrust = store.checkpoints.length > 0
    ? Math.round(store.checkpoints.reduce((sum, cp) => sum + cp.trust_score, 0) / store.checkpoints.length)
    : 0

  const statusCards = [
    { value: store.sessionActive ? 'Live' : 'Idle', label: 'Session state' },
    { value: formatDuration(elapsed), label: 'Elapsed time' },
    { value: `${store.checkpoints.length}`, label: 'Checkpoints recorded' },
    { value: `${averageTrust}%`, label: 'Average trust' },
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
              <span className={styles.pulseDot} style={{ background: store.sessionActive ? '#00FF88' : '#00C2FF', boxShadow: `0 0 12px ${store.sessionActive ? 'rgba(0,255,136,0.45)' : 'rgba(0,194,255,0.45)'}` }} />
              <span style={{ fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: 'rgba(249,250,251,0.9)' }}>
                Exam session monitoring
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '1.25rem' }}>
              <svg width="42" height="42" viewBox="0 0 28 28">
                <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="4" fill="#00C2FF" opacity="0.45" />
              </svg>
              <span className={styles.mono} style={{ color: '#00C2FF', fontWeight: 800, letterSpacing: '0.24em', fontSize: 14 }}>
                EDGUARD SESSION
              </span>
            </div>

            <h1 className={styles.headline} style={{ fontSize: 'clamp(2.15rem, 8vw, 4.8rem)', marginTop: '1rem' }}>
              Monitor identity
              <br />
              <span style={{ color: 'var(--cyan)' }}>during the exam.</span>
            </h1>

            <p className={styles.muted} style={{ marginTop: '1rem', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto', fontSize: 'clamp(0.95rem, 2.5vw, 1.06rem)', lineHeight: 1.7 }}>
              Start a monitored session, trigger manual or automatic checkpoints, and keep a compact trust history across the full exam flow.
            </p>

            <div className={styles.statsGrid}>
              {statusCards.map((item) => (
                <div key={item.label} className={styles.card} style={{ textAlign: 'left', background: 'rgba(17,24,39,0.55)' }}>
                  <div className={styles.mono} style={{ fontSize: 'clamp(1.2rem, 4vw, 1.65rem)', fontWeight: 800, color: 'var(--cyan)' }}>
                    {item.value}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 6, fontSize: '0.8125rem' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="edguardSessionLayout" style={{ marginTop: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className={styles.card} style={{ background: 'rgba(17,24,39,0.58)', position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence>
                  {pulseColor && (
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2 }}
                      className="absolute inset-0 z-10 rounded-2xl pointer-events-none"
                      style={{ boxShadow: `inset 0 0 60px ${pulseColor}40` }}
                    />
                  )}
                </AnimatePresence>

                {phase === 'setup' && <SessionSetup onStart={handleStart} />}

                {(phase === 'active' || phase === 'checkpoint') && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <svg width="16" height="16" viewBox="0 0 28 28">
                          <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
                        </svg>
                        <span className="text-xs sm:text-sm font-black tracking-widest" style={{ color: '#F0F4FF' }}>
                          {t('session_title')}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold tabular-nums tracking-wider" style={{ color: '#00C2FF' }}>
                        {formatDuration(elapsed)}
                      </span>
                    </div>

                    <div className="h-px w-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold tracking-wider" style={{ color: '#8899BB' }}>
                      <span>ID: <span style={{ color: '#F0F4FF' }}>{store.studentId}</span></span>
                      <span>Session: <span style={{ color: '#F0F4FF' }}>{store.sessionId.slice(0, 8)}</span></span>
                      {examName && <span>Exam: <span style={{ color: '#F0F4FF' }}>{examName}</span></span>}
                    </div>

                    <div className="edguardSessionActiveGrid">
                      <div className={styles.card} style={{ background: 'rgba(3,7,18,0.55)', padding: '0.75rem' }}>
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '4/3' }}>
                          <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={0.8}
                            videoConstraints={VIDEO_CONSTRAINTS}
                            className="w-full h-full object-cover block"
                          />
                        </div>
                      </div>

                      <div className={styles.card} style={{ background: 'rgba(3,7,18,0.55)' }}>
                        <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{t('session_current_status').toUpperCase()}</p>
                        <div style={{ display: 'grid', gap: 10, marginTop: '0.75rem' }}>
                          {[
                            { label: t('session_identity_verified'), ok: store.currentStatus !== 'ALERT' },
                            { label: t('session_liveness_confirmed'), ok: store.currentStatus !== 'ALERT' },
                            { label: t('session_cognitive_stable'), ok: store.currentStatus === 'CLEAR' || store.currentStatus === 'IDLE' },
                          ].map((s) => (
                            <div key={s.label} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.ok ? '#00FF88' : '#FF3355' }} />
                              <span className="text-[10px] font-semibold tracking-wider" style={{ color: s.ok ? '#F0F4FF' : '#FF3355' }}>
                                {s.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleManualCheckpoint}
                          disabled={runningCheckpoint}
                          className={`${styles.btn} ${styles.btnOutline}`}
                          style={{ width: '100%', marginTop: '1rem', opacity: runningCheckpoint ? 0.4 : 1 }}
                        >
                          {t('session_manual_checkpoint').toUpperCase()}
                        </button>
                      </div>
                    </div>

                    {store.checkpoints.length > 0 && (
                      <div className={styles.card} style={{ background: 'rgba(3,7,18,0.55)' }}>
                        <p className="text-[10px] font-semibold tracking-widest mb-2" style={{ color: '#8899BB' }}>
                          {t('session_history').toUpperCase()} ({store.checkpoints.length})
                        </p>
                        <div className="max-h-56 overflow-y-auto space-y-0.5">
                          {[...store.checkpoints].reverse().map((cp) => (
                            <CheckpointItem key={cp.checkpoint_number} cp={cp} />
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleEnd}
                      className={`${styles.btn} ${styles.btnOutline}`}
                      style={{ width: '100%', color: '#FF3355', borderColor: 'rgba(255,51,85,0.45)' }}
                    >
                      ⏹ {t('edguard_end_session').toUpperCase()}
                    </button>

                    <AnimatePresence>
                      {phase === 'checkpoint' && (
                        <MiniReactionTest onDone={runCheckpoint} />
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {phase === 'summary' && (
                  <SessionSummary checkpoints={store.checkpoints} duration={elapsed} />
                )}
              </div>
            </motion.div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                {
                  title: 'Continuous trust',
                  body: 'Each checkpoint updates the exam trust trail so academic staff can review the session in context.',
                },
                {
                  title: 'Manual control',
                  body: 'You can force an extra checkpoint at any time without interrupting the full monitoring flow.',
                },
                {
                  title: 'Compact reporting',
                  body: 'The summary view keeps duration, alerts, history, and PDF export in one final review panel.',
                },
              ].map((item, idx) => (
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
                  Session scope
                </div>
                <div style={{ display: 'grid', gap: 10, marginTop: '0.9rem' }}>
                  {['Live webcam signal', 'Automatic 5-minute checkpoints', 'End-of-session trust summary'].map((point) => (
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
          .edguardSessionLayout {
            display: grid;
            grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
            gap: 1rem;
            align-items: start;
          }

          .edguardSessionActiveGrid {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
            gap: 1rem;
            align-items: start;
          }

          @media (max-width: 960px) {
            .edguardSessionLayout,
            .edguardSessionActiveGrid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    </div>
  )
}
