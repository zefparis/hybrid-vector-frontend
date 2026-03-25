import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Webcam from 'react-webcam'
import { behavioralCollector, cognitiveCollector, faceCollector } from '@/signal-engine'
import { useEdguardStore } from '@/store/edguardStore'
import { sessionCheckpoint } from '@/services/edguardApi'
import type { CheckpointResponse } from '@/services/edguardApi'
import { useT } from '@/i18n/useLang'

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
          {new Date(cp.timestamp).toLocaleTimeString('fr-FR')}
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
          {t('edguard_title')} — ENROLLMENT
        </p>
        <div className="h-px w-full mt-3" style={{ backgroundColor: '#1E2D45' }} />
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
        className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
        style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
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
  const verdict = alertCount === 0 && avgScore >= 70 ? 'VALIDÉ' : alertCount > 0 ? 'SUSPECT' : 'ATTENTION'
  const verdictColor = verdict === 'VALIDÉ' ? '#00FF88' : verdict === 'SUSPECT' ? '#FF3355' : '#FF8C00'

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
      ${checkpoints.map((c) => `<tr><td>${c.checkpoint_number}</td><td>${new Date(c.timestamp).toLocaleTimeString('fr-FR')}</td><td>${c.trust_score}%</td><td>${c.alert_level}</td><td>${c.flags.join(', ') || '—'}</td></tr>`).join('')}
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
        className="w-full py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
        style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF' }}
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
    behavioralCollector.start()

    return () => {
      behavioralCollector.stop()
    }
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

    if (frame) {
      faceCollector.capture(frame)
    }

    cognitiveCollector.record({ testId: 'exam', score: cogScore, durationMs: cognitiveMs })

    const result = await sessionCheckpoint({
      student_id: store.studentId,
      session_id: store.sessionId,
      checkpoint_number: store.checkpointNumber + 1,
      face_b64: frame,
      cognitive_score: cogScore,
    })

    store.addCheckpoint(result)
    setPulseColor(alertColor(result.alert_level))
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

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 sm:px-4 overflow-x-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="max-w-2xl mx-auto relative w-full pt-6 sm:pt-8">
        <div
          className="rounded-2xl p-5 sm:p-7 relative overflow-hidden"
          style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
        >
          {/* Pulse overlay */}
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

          {/* Setup */}
          {phase === 'setup' && <SessionSetup onStart={handleStart} />}

          {/* Active session */}
          {(phase === 'active' || phase === 'checkpoint') && (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
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
              <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

              {/* Info row */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold tracking-wider" style={{ color: '#8899BB' }}>
                <span>ID: <span style={{ color: '#F0F4FF' }}>{store.studentId}</span></span>
                <span>Session: <span style={{ color: '#F0F4FF' }}>{store.sessionId.slice(0, 8)}</span></span>
                {examName && <span>Examen: <span style={{ color: '#F0F4FF' }}>{examName}</span></span>}
              </div>

              {/* Webcam + status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Small webcam */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E2D45', aspectRatio: '4/3' }}>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.8}
                    videoConstraints={VIDEO_CONSTRAINTS}
                    className="w-full h-full object-cover block"
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{t('session_current_status').toUpperCase()}</p>
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

                  <button
                    onClick={handleManualCheckpoint}
                    disabled={runningCheckpoint}
                    className="mt-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest transition-all duration-200 disabled:opacity-40"
                    style={{ border: '1px solid #1E2D45', color: '#00C2FF' }}
                  >
                    {t('session_manual_checkpoint').toUpperCase()}
                  </button>
                </div>
              </div>

              {/* Checkpoint history */}
              {store.checkpoints.length > 0 && (
                <div>
                  <div className="h-px w-full mb-3" style={{ backgroundColor: '#1E2D45' }} />
                  <p className="text-[10px] font-semibold tracking-widest mb-2" style={{ color: '#8899BB' }}>
                    {t('session_history').toUpperCase()} ({store.checkpoints.length})
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {[...store.checkpoints].reverse().map((cp) => (
                      <CheckpointItem key={cp.checkpoint_number} cp={cp} />
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

              <button
                onClick={handleEnd}
                className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
                style={{ border: '1.5px solid #FF3355', color: '#FF3355' }}
              >
                ⏹ {t('edguard_end_session').toUpperCase()}
              </button>

              {/* Cognitive overlay */}
              <AnimatePresence>
                {phase === 'checkpoint' && (
                  <MiniReactionTest onDone={runCheckpoint} />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Summary */}
          {phase === 'summary' && (
            <SessionSummary checkpoints={store.checkpoints} duration={elapsed} />
          )}
        </div>
      </div>
    </div>
  )
}
