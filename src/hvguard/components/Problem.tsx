import styles from '../theme.module.css'
import { useInView } from '../hooks/useInView'

type Pain = { icon: string; title: string; desc: string }

export function Problem() {
  const { ref, inView } = useInView<HTMLDivElement>()

  const pains: Pain[] = [
    {
      icon: '🏗️',
      title: 'Workers clock in for absent colleagues',
      desc: 'Biometric proxy attendance is still a daily reality on sites and mines.',
    },
    {
      icon: '💰',
      title: 'Salaries paid to ghost employees',
      desc: 'Payroll fraud scales silently when identity is weak.',
    },
    {
      icon: '📋',
      title: 'Exam fraud destroys institutional trust',
      desc: 'Once credibility is lost, every certificate becomes questionable.',
    },
  ]

  return (
    <section className={`${styles.section} ${styles.surface}`}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`} style={{ maxWidth: 720 }}>
          <h2 className={styles.headline}>
            Identity fraud costs Africa billions every year.
          </h2>
          <p className={styles.muted} style={{ marginTop: '0.875rem', fontSize: '1rem', lineHeight: 1.7 }}>
            Traditional solutions use passwords, ID cards, or basic face scans. We use 5 layers.
          </p>
        </div>

        <div className="problemGrid" style={{ marginTop: '1.75rem' }}>
          {pains.map((p, idx) => (
            <div
              key={p.title}
              className={`${styles.card} ${styles.fadeUp} ${inView ? styles.fadeUpVisible : ''}`}
              style={{
                background: 'rgba(17,24,39,0.55)',
                transitionDelay: inView ? `${idx * 90}ms` : '0ms',
              }}
            >
              <div style={{ fontSize: 20 }}>{p.icon}</div>
              <div style={{ fontWeight: 700, marginTop: '0.625rem', fontSize: '0.9375rem' }}>{p.title}</div>
              <div className={styles.muted} style={{ marginTop: '0.5rem', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .problemGrid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
          @media (max-width: 768px) {
            .problemGrid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </section>
  )
}
