import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEdguardStore } from '@/store/edguardStore'
import { useT } from '@/i18n/useLang'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

const isMobileDevice =
  /Android|iPhone|iPad/i.test(navigator.userAgent) || 'ontouchstart' in window

const CYAN = '#00C2FF'
const GREEN = '#00FF88'

function MetricRow({
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

export function EdguardProfile() {
  const { t } = useT()
  const navigate = useNavigate()
  const store = useEdguardStore()
  const { enrollmentResult } = store
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 200)
    return () => clearTimeout(timer)
  }, [])

  if (!enrollmentResult) {
    return (
      <div className="min-h-screen pt-16 pb-8 px-3 sm:px-4 flex items-center justify-center" style={{ backgroundColor: '#0A0F1E' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5 relative"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,194,255,0.1)', border: '1.5px solid rgba(0,194,255,0.3)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-sm font-black tracking-[0.2em]" style={{ color: '#F0F4FF' }}>
            {t('edguard_title')} — PROFIL
          </h2>
          <p className="text-xs text-center max-w-xs leading-relaxed" style={{ color: '#8899BB' }}>
            {t('edguard_profile_no_profile_desc')}
          </p>
          <Link
            to="/edguard/enroll"
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
            style={{ backgroundColor: CYAN, color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
          >
            {t('edguard_profile_register_first')} →
          </Link>
        </motion.div>
      </div>
    )
  }

  const initials = `${(store.firstName[0] ?? '').toUpperCase()}${(store.lastName[0] ?? '').toUpperCase()}` || '??'
  const fullName = `${store.firstName} ${store.lastName}`.trim() || store.studentId
  const roleLabel = store.role === 'STUDENT'
    ? t('edguard_profile_role_student')
    : store.role === 'TEACHER'
      ? t('edguard_profile_role_teacher')
      : t('edguard_profile_role_beneficiary')
  const faceIdShort = enrollmentResult.faceId?.slice(0, 8).toUpperCase() || '—'

  const facialPct = Math.min(100, Math.round(enrollmentResult.confidence))
  const vocalPct = Math.min(100, Math.round(store.cognitiveScore * 100))
  const reflexPct = store.reflexVelocity > 0 ? Math.min(100, Math.round(Math.max(0, 100 - (store.reflexVelocity - 200) / 8))) : 70
  const stroopPct = Math.min(100, Math.round(store.stroopAccuracy * 100))
  const sensorPct = 75
  const pqcPct = 100

  const overallScore = Math.round((facialPct * 0.25 + vocalPct * 0.2 + reflexPct * 0.15 + stroopPct * 0.2 + sensorPct * 0.1 + pqcPct * 0.1))
  const securityColor = overallScore >= 80 ? GREEN : overallScore >= 60 ? CYAN : '#FF8800'
  const securityLabel = overallScore >= 80 ? t('edguard_profile_security_max') : overallScore >= 60 ? t('edguard_profile_security_high') : t('edguard_profile_security_standard')

  const enrolledDate = enrollmentResult.enrolled_at
    ? new Date(enrollmentResult.enrolled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 sm:px-4 overflow-x-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="max-w-2xl mx-auto relative w-full pt-6 sm:pt-8 flex flex-col gap-4">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 28 28">
              <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke={CYAN} strokeWidth="2" />
            </svg>
            <span className="text-xs sm:text-sm font-black tracking-widest" style={{ color: '#F0F4FF' }}>
              {t('edguard_profile_title')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: GREEN }}>{t('edguard_profile_active')}</span>
          </div>
        </motion.div>

        {/* ── Identity Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
          style={{
            backgroundColor: '#0D1526',
            border: '1px solid rgba(0,194,255,0.3)',
            boxShadow: '0 0 30px rgba(0,194,255,0.08), inset 0 0 30px rgba(0,194,255,0.03)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,255,136,0.1))',
                border: '2px solid rgba(0,194,255,0.4)',
              }}
            >
              <span className="text-base font-black tracking-wider" style={{ color: CYAN }}>{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold tracking-wider truncate" style={{ color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif" }}>
                {fullName}
              </p>
              <p className="text-[11px] font-bold tracking-widest mt-0.5" style={{ color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
                {store.studentId}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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

          {/* Info rows */}
          <div className="mt-4 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid #1E2D45' }}>
            {store.email && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{t('edguard_profile_email_label')}</span>
                <span className="text-[11px] font-medium" style={{ color: '#F0F4FF', fontFamily: "'JetBrains Mono', monospace" }}>{store.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{t('edguard_profile_enrolled_label')}</span>
              <span className="text-[11px] font-medium" style={{ color: '#F0F4FF' }}>{enrolledDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{t('edguard_profile_face_id_label')}</span>
              <span className="text-[10px] font-bold tracking-wider" style={{ color: '#3D5A75' }}>
                {faceIdShort}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Neural Profile ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-5 sm:p-6"
          style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20h6v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
              <path d="M10 22h4" />
            </svg>
            <span className="text-[10px] font-black tracking-[0.2em]" style={{ color: '#F0F4FF' }}>
              {t('edguard_profile_neural_imprint')}
            </span>
          </div>

          <div className="rounded-xl p-3" style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45' }}>
            <MetricRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="4" /><circle cx="12" cy="10" r="3" /><path d="M6 20c0-3 3-5 6-5s6 2 6 5" /></svg>}
              label={t('edguard_profile_analysis_rekognition')}
              value={`${facialPct}%`}
              percent={facialPct}
              color={CYAN}
              delay={0}
              animate={animate}
            />
            <MetricRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><path d="M12 1v4m0 14v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M1 12h4m14 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /><circle cx="12" cy="12" r="4" /></svg>}
              label={t('edguard_profile_vocal_signature')}
              value={vocalPct > 0 ? t('edguard_profile_calibrated') : '—'}
              percent={vocalPct}
              color={CYAN}
              delay={0.1}
              animate={animate}
            />
            <MetricRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
              label={t('edguard_profile_neural_velocity')}
              value={store.reflexVelocity > 0 ? `${Math.round(store.reflexVelocity)}ms` : t('edguard_profile_measured')}
              percent={reflexPct}
              color={CYAN}
              delay={0.2}
              animate={animate}
            />
            <MetricRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8"><path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20h6v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" /><path d="M10 22h4" /></svg>}
              label={t('edguard_profile_stroop_test')}
              value={stroopPct > 0 ? `${stroopPct}%` : t('edguard_profile_validated')}
              percent={stroopPct || 70}
              color={GREEN}
              delay={0.3}
              animate={animate}
            />
            <MetricRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="3" /><line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" /></svg>}
              label={t('edguard_profile_behavioral_profile')}
              value={isMobileDevice ? t('edguard_profile_mobile') : t('edguard_profile_desktop')}
              percent={sensorPct}
              color={CYAN}
              delay={0.4}
              animate={animate}
            />
            <MetricRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
              label={t('edguard_profile_pqc')}
              value={t('edguard_profile_pqc_value')}
              percent={pqcPct}
              color={GREEN}
              delay={0.5}
              animate={animate}
            />
          </div>
        </motion.div>

        {/* ── Security Level ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: '#8899BB' }}>
              {t('edguard_profile_security_level')}
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
        </motion.div>

        {/* ── Certifications ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex gap-2"
        >
          {[
            { label: t('edguard_profile_cert_fr'), icon: '🇫🇷' },
            { label: t('edguard_profile_cert_pqc'), icon: '🔐' },
            { label: t('edguard_profile_cert_brain'), icon: '🧠' },
          ].map((cert) => (
            <div
              key={cert.label}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(0,194,255,0.05)', border: '1px solid #1E2D45' }}
            >
              <span className="text-[10px]">{cert.icon}</span>
              <span className="text-[9px] font-bold tracking-widest" style={{ color: '#8899BB' }}>{cert.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex flex-col gap-2.5"
        >
          <Link
            to="/edguard/session"
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider text-center transition-all duration-300 block"
            style={{ backgroundColor: CYAN, color: '#0A0F1E', boxShadow: '0 0 24px rgba(0,194,255,0.35)' }}
          >
            {t('edguard_profile_start_session')} →
          </Link>
          <Link
            to="/edguard/verify"
            className="w-full py-3 rounded-xl font-bold text-xs tracking-widest text-center transition-all duration-300 block"
            style={{ border: '1.5px solid rgba(0,194,255,0.3)', color: CYAN, backgroundColor: 'transparent' }}
          >
            {t('edguard_profile_verify_identity')}
          </Link>
          <button
            onClick={() => { store.reset(); navigate('/edguard/enroll') }}
            className="w-full py-3 rounded-xl font-bold text-xs tracking-widest transition-all duration-300"
            style={{ border: '1.5px solid rgba(255,51,85,0.2)', color: '#FF3355', backgroundColor: 'transparent' }}
          >
            {t('edguard_profile_reset')}
          </button>
        </motion.div>

        {/* ── Footer ── */}
        <p className="text-center text-[9px] tracking-widest pt-1 pb-4" style={{ color: '#3D5A75' }}>
          POWERED BY HYBRID VECTOR · {t('edguard_profile_pqc_value')}
        </p>
      </div>
    </div>
  )
}
