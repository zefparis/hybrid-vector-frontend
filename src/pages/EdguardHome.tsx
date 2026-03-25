import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from '@/hvguard/theme.module.css'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

function HexIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 28 28">
      <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="4" fill="#00C2FF" opacity="0.6" />
    </svg>
  )
}

function UserScanIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v4h0a8 8 0 0 1 16 0v0h0v-4" />
      <path d="M2 20v-4h0a8 8 0 0 0 16 0v0h0v4" />
      <circle cx="10" cy="10" r="3" />
      <path d="M10 13a5 5 0 0 0-5 5" />
      <path d="M10 13a5 5 0 0 1 5 5" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

export function EdguardHome() {
  const stats = [
    { value: '2 min', label: 'Average setup time' },
    { value: 'Live', label: 'Face capture verification' },
    { value: '24/7', label: 'Exam access readiness' },
    { value: 'PWA', label: 'Open or install on mobile' },
  ]

  const actions = [
    {
      to: '/edguard/enroll',
      eyebrow: 'Enrollment',
      title: 'Enroll a student',
      description: 'Create a secure student profile with identity details and a live reference selfie before exam day.',
      points: ['Student identity form', 'Live selfie capture', 'Ready for future verification'],
      cta: 'Start Enrollment →',
      icon: <UserScanIcon />,
    },
    {
      to: '/edguard/verify',
      eyebrow: 'Verification',
      title: 'Verify identity',
      description: 'Confirm a returning student in seconds with a fresh capture before granting access to the exam session.',
      points: ['Fast student lookup', 'Face match validation', 'Immediate exam access'],
      cta: 'Start Verification →',
      icon: <ShieldCheckIcon />,
    },
  ]

  const highlights = [
    {
      title: 'Built for mobile browsers',
      description: 'Students can start directly from their phone without a complex setup.',
    },
    {
      title: 'Simple two-step flow',
      description: 'Enrollment and verification are separated clearly, like the other Guard products.',
    },
    {
      title: 'Exam-focused experience',
      description: 'The interface is streamlined for academic identity checks instead of generic landing content.',
    },
  ]

  return (
    <div className={styles.app} style={{ background: '#030712' }}>
      <section className={styles.hero} style={{ minHeight: 'auto', paddingBottom: '3rem' }}>
        <div className={`${styles.heroBackdrop} ${styles.gridBg}`} style={{ opacity: 0.75 }} />
        <div className={styles.heroBackdrop} style={{ background: 'radial-gradient(ellipse at 50% 22%, rgba(0,194,255,0.16) 0%, transparent 58%)' }} />
        <div className={styles.heroBackdrop} style={{ backgroundImage: HEX_PATTERN, opacity: 0.6 }} />
        <div className={styles.scanLine} />

        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
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
                Exam Identity Guard
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: '1.25rem' }}>
              <HexIcon />
              <span className={styles.mono} style={{ color: '#00C2FF', fontWeight: 800, letterSpacing: '0.24em', fontSize: 14 }}>
                EDGUARD
              </span>
            </div>

            <h1
              className={styles.headline}
              style={{
                fontSize: 'clamp(2.4rem, 9vw, 5.25rem)',
                lineHeight: 1,
                marginTop: '1rem',
              }}
            >
              Secure identity
              <br />
              <span style={{ color: 'var(--cyan)' }}>before every exam.</span>
            </h1>

            <p
              className={styles.muted}
              style={{
                fontSize: 'clamp(0.96rem, 2.6vw, 1.1rem)',
                lineHeight: 1.7,
                marginTop: '1rem',
                maxWidth: 680,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              EdGuard gives academic teams a clean flow to enroll students, verify returning identities, and keep exam access fast on mobile.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <Link to="/edguard/enroll" className={`${styles.btn} ${styles.btnPrimary}`} style={{ textDecoration: 'none', minWidth: 210 }}>
                Start Enrollment →
              </Link>
              <Link to="/edguard/verify" className={`${styles.btn} ${styles.btnOutline}`} style={{ textDecoration: 'none', minWidth: 210 }}>
                Start Verification →
              </Link>
            </div>

            <div className={styles.statsGrid}>
              {stats.map((item) => (
                <div key={item.label} className={styles.card} style={{ textAlign: 'left', background: 'rgba(17,24,39,0.55)' }}>
                  <div className={styles.mono} style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: 'var(--cyan)' }}>
                    {item.value}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 6, fontSize: '0.8125rem' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.surface}`} style={{ paddingTop: '2.5rem' }}>
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ maxWidth: 720 }}
          >
            <h2 className={styles.headline}>Choose the right exam entry point.</h2>
            <p className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '1rem', lineHeight: 1.7 }}>
              The EdGuard home should work like the other Guard surfaces: clear choices, compact cards, and direct actions.
            </p>
          </motion.div>

          <div className="edguardActionGrid" style={{ marginTop: '1.75rem' }}>
            {actions.map((action, idx) => (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + idx * 0.12, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link to={action.to} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className={`${styles.card} ${styles.lift} ${styles.glowCyan}`} style={{ background: 'rgba(17,24,39,0.55)', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,194,255,0.08)',
                          border: '1px solid rgba(0,194,255,0.18)',
                          color: '#00C2FF',
                          flexShrink: 0,
                        }}
                      >
                        {action.icon}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7DDFFF' }}>
                        {action.eyebrow}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: '"Syne", system-ui, sans-serif', fontSize: '1.5rem', lineHeight: 1.1, marginTop: '1rem', fontWeight: 800, color: '#F9FAFB' }}>
                      {action.title}
                    </h3>

                    <p className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
                      {action.description}
                    </p>

                    <div style={{ display: 'grid', gap: 10, marginTop: '1rem' }}>
                      {action.points.map((point) => (
                        <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#E5EEF9', fontSize: '0.875rem', lineHeight: 1.5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 999, background: '#00C2FF', flexShrink: 0 }} />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1.25rem' }}>
                      <span className={`${styles.btn} ${styles.btnOutline}`} style={{ width: '100%', textDecoration: 'none' }}>
                        {action.cta}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ paddingTop: '2.25rem' }}>
        <div className={styles.container}>
          <div className="edguardHighlightGrid">
            {highlights.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.45 }}
                className={styles.card}
                style={{ background: 'rgba(17,24,39,0.45)' }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#F9FAFB' }}>{item.title}</div>
                <div className={styles.muted} style={{ marginTop: '0.625rem', fontSize: '0.875rem', lineHeight: 1.7 }}>{item.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .edguardActionGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .edguardHighlightGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        @media (max-width: 900px) {
          .edguardActionGrid,
          .edguardHighlightGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
