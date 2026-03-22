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
        <div
          ref={ref}
          className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`}
          style={{ maxWidth: 880 }}
        >
          <h2 className={styles.headline} style={{ fontSize: 44, lineHeight: 1.05 }}>
            Identity fraud costs Africa
            <br />
            billions every year.
          </h2>
          <p className={styles.muted} style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7 }}>
            Traditional solutions use passwords, ID cards, or basic face scans. We use 5 layers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 26 }}>
          {pains.map((p, idx) => (
            <div
              key={p.title}
              className={`${styles.card} ${styles.fadeUp} ${inView ? styles.fadeUpVisible : ''}`}
              style={{
                background: 'rgba(17,24,39,0.55)',
                transitionDelay: inView ? `${idx * 90}ms` : '0ms',
              }}
            >
              <div style={{ fontSize: 22 }}>{p.icon}</div>
              <div style={{ fontWeight: 900, marginTop: 10, fontSize: 15 }}>{p.title}</div>
              <div className={styles.muted} style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .${styles.container} > div[style*="grid-template-columns: repeat"] { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </section>
  )
}
