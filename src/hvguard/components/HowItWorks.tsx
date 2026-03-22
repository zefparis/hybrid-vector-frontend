import styles from '../theme.module.css'
import { useInView } from '../hooks/useInView'

type Step = { n: string; title: string; desc: string }

export function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>()

  const steps: Step[] = [
    {
      n: '01',
      title: 'Enroll Once (2 minutes)',
      desc: 'Face + Voice + Cognitive + Behavioral profile. Post-quantum signed identity created.',
    },
    {
      n: '02',
      title: 'Verify in Seconds',
      desc: 'Name + Selfie → 99.99% match. Works on any smartphone.',
    },
    {
      n: '03',
      title: 'Certified & Immutable',
      desc: 'Every action signed with ML-KEM-768. Air-gap mode available for remote sites.',
    },
  ]

  return (
    <section id="how" className={`${styles.section} ${styles.surface}`}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`}>
          <h2 className={styles.headline}>How it works</h2>
        </div>

        <div className="howGrid" style={{ position: 'relative', marginTop: '1.75rem' }}>
          {/* Connecting line — desktop only */}
          <div className="howLine" aria-hidden style={{
            position: 'absolute',
            left: 18,
            right: 18,
            top: 52,
            height: 2,
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }} />
          <div className="howLine" aria-hidden style={{
            position: 'absolute',
            left: 18,
            right: 18,
            top: 52,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.55), transparent)',
            opacity: 0.35,
            animation: 'hvDots 2.4s linear infinite',
            backgroundSize: '200px 2px',
            pointerEvents: 'none',
          }} />

          <style>{`
            @keyframes hvDots {
              0%   { background-position: 0 0; }
              100% { background-position: 200px 0; }
            }
            .howGrid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 1rem;
            }
            @media (max-width: 768px) {
              .howGrid { grid-template-columns: 1fr; }
              .howLine { display: none; }
            }
          `}</style>

          {steps.map((s, idx) => (
            <div
              key={s.n}
              className={`${styles.card} ${styles.fadeUp} ${inView ? styles.fadeUpVisible : ''}`}
              style={{
                background: 'rgba(17,24,39,0.55)',
                transitionDelay: inView ? `${idx * 90}ms` : '0ms',
              }}
            >
              <div className={styles.mono} style={{ color: 'var(--cyan)', fontWeight: 800, fontSize: '0.875rem' }}>{s.n}</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>{s.title}</div>
              <div className={styles.muted} style={{ marginTop: '0.625rem', fontSize: '0.8125rem', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
