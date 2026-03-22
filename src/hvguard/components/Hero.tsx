import { useMemo } from 'react'
import styles from '../theme.module.css'
import { useInView } from '../hooks/useInView'
import { useCountUp } from '../hooks/useCountUp'

type Stat = {
  label: string
  valueText: string
  to?: number
  suffix?: string
  prefix?: string
}

const PARTICLE_COUNT = 46

type Particle = { id: number; left: number; top: number; size: number; delay: number; duration: number; opacity: number }

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: (i / PARTICLE_COUNT) * 100 + (Math.sin(i * 2.1) * 4),
    top: (Math.cos(i * 1.7) * 20 + 40),
    size: 1 + (i % 3),
    delay: (i * 0.41) % 12,
    duration: 16 + (i % 8) * 1.2,
    opacity: 0.12 + (i % 5) * 0.06,
  }))
}

function fmt(stat: Stat, n: number) {
  const pre = stat.prefix ?? ''
  const suf = stat.suffix ?? ''
  if (stat.to === undefined) return stat.valueText
  if (stat.suffix === '%') return `${pre}${n.toFixed(2)}${suf}`
  return `${pre}${Math.round(n)}${suf}`
}

export function Hero() {
  const particles = useMemo(generateParticles, [])
  const { ref: statsRef, inView: statsInView } = useInView<HTMLDivElement>({ threshold: 0.25 })

  const stats: Stat[] = [
    { label: 'Facial accuracy', valueText: '99.99%', to: 99.99, suffix: '%' },
    { label: 'Biometric layers', valueText: '5', to: 5 },
    { label: 'French patents', valueText: '3', to: 3 },
    { label: 'Verification time', valueText: '<2s', to: 2, prefix: '<', suffix: 's' },
  ]

  const s0 = useCountUp({ enabled: statsInView, to: 99.99, durationMs: 2000, decimals: 2 })
  const s1 = useCountUp({ enabled: statsInView, to: 5, durationMs: 1600 })
  const s2 = useCountUp({ enabled: statsInView, to: 3, durationMs: 1400 })
  const s3 = useCountUp({ enabled: statsInView, to: 2, durationMs: 1600 })
  const values = [s0, s1, s2, s3]

  return (
    <section id="top" className={styles.hero}>
      <div className={`${styles.heroBackdrop} ${styles.gridBg}`} style={{ opacity: 0.9 }} />
      <div className={styles.heroBackdrop} style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(0,194,255,0.14) 0%, transparent 60%)' }} />
      <div className={styles.scanLine} />

      <div className={styles.heroBackdrop}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              borderRadius: 999,
              background: 'rgba(0,194,255,0.9)',
              opacity: p.opacity,
              animation: `hvFloat ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}

        <style>{`
          @keyframes hvFloat {
            0% { transform: translateY(30px); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(-60px); opacity: 0; }
          }
        `}</style>
      </div>

      <div className={styles.container}>
        <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
          <div
            className={styles.card}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'rgba(17,24,39,0.45)',
              borderColor: 'rgba(34,197,94,0.25)',
            }}
          >
            <span className={styles.pulseDot} />
            <span style={{ fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, color: 'rgba(249,250,251,0.9)' }}>
              Live in production
            </span>
          </div>

          <h1 className={styles.headline} style={{ fontSize: 64, lineHeight: 0.98, marginTop: 22 }}>
            Identity Beyond
            <br />
            <span style={{ color: 'var(--cyan)' }}>Biometrics.</span>
          </h1>

          <p className={styles.muted} style={{ fontSize: 18, lineHeight: 1.7, marginTop: 18 }}>
            The only platform combining facial recognition, voice biometrics, cognitive testing, behavioral analysis, and post-quantum cryptography.
            <br />
            Built for Africa. Certified for the world.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See Our Products ↓
            </button>
            <button
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => window.open('https://www.youtube.com', '_blank', 'noopener,noreferrer')}
            >
              Watch 2-min Demo
            </button>
          </div>

          <div ref={statsRef} className={styles.statsGrid}>
            {stats.map((s, idx) => (
              <div key={s.label} className={styles.card} style={{ textAlign: 'left', background: 'rgba(17,24,39,0.55)' }}>
                <div className={styles.mono} style={{ fontSize: 28, fontWeight: 800, color: 'var(--cyan)' }}>
                  {fmt(s, values[idx] ?? 0)}
                </div>
                <div style={{ fontWeight: 800, marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
