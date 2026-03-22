import styles from '../theme.module.css'
import { useInView } from '../hooks/useInView'

type Product = {
  num: string
  name: string
  color: string
  icon: string
  title: string
  desc: string
  stat: string
  href: string
  glowClass: string
}

export function Products() {
  const { ref, inView } = useInView<HTMLDivElement>()

  const products: Product[] = [
    {
      num: '01',
      name: 'WORKGUARD',
      color: 'var(--cyan)',
      icon: '⛑️',
      title: 'Worker attendance verification',
      desc: 'Prevent ghost workers on construction sites',
      stat: 'R18 / worker / month',
      href: 'https://workguard.vercel.app',
      glowClass: styles.glowCyan,
    },
    {
      num: '02',
      name: 'PAYGUARD',
      color: 'var(--green)',
      icon: '🛡️',
      title: 'Biometric payroll validation',
      desc: 'Confirm salary receipt with your face',
      stat: 'R9 / transaction',
      href: 'https://payguard-one.vercel.app',
      glowClass: styles.glowGreen,
    },
    {
      num: '03',
      name: 'EDGUARD',
      color: 'var(--blue)',
      icon: '🎓',
      title: 'Academic identity shield',
      desc: 'Continuous exam monitoring',
      stat: 'R36 / exam session',
      href: 'https://edguard-v2.vercel.app',
      glowClass: styles.glowBlue,
    },
    {
      num: '04',
      name: 'ACCESSGUARD',
      color: 'var(--amber)',
      icon: '🔒',
      title: 'Physical access control',
      desc: 'QR + biometrics for secure sites',
      stat: 'R900 / access point / month',
      href: 'https://accessguard-cyan.vercel.app',
      glowClass: styles.glowAmber,
    },
    {
      num: '05',
      name: 'SIGNGUARD',
      color: 'var(--purple)',
      icon: '✒️',
      title: 'Biometric document signing',
      desc: 'Post-quantum certified contracts',
      stat: 'R90 / signed document',
      href: 'https://signguard-one.vercel.app',
      glowClass: styles.glowPurple,
    },
  ]

  return (
    <section id="products" className={styles.section}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`}>
          <h2 className={styles.headline} style={{ fontSize: 44, lineHeight: 1.06 }}>
            One identity. Five applications.
          </h2>
          <p className={styles.muted} style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7, maxWidth: 860 }}>
            HV-GUARD is a family of systems built on the same 5-layer identity engine.
          </p>
        </div>

        <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {products.map((p, idx) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className={`${styles.card} ${styles.lift} ${p.glowClass} ${styles.fadeUp} ${inView ? styles.fadeUpVisible : ''}`}
              style={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                borderTop: `3px solid ${p.color}`,
                transitionDelay: inView ? `${idx * 90}ms` : '0ms',
                minHeight: '100%',
                gridColumn: idx >= 3 ? (idx === 3 ? '2 / 3' : '3 / 4') : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, opacity: 0.18, fontSize: 40, lineHeight: 1 }}>
                  {p.num}
                </div>
                <div style={{ fontSize: 22 }}>{p.icon}</div>
              </div>

              <div style={{ marginTop: 12, flex: 1 }}>
                <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, letterSpacing: '0.04em' }}>{p.name}</div>
                <div style={{ marginTop: 6, fontWeight: 900 }}>{p.title}</div>
                <div className={styles.muted} style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6 }}>{p.desc}</div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div className={styles.mono} style={{ fontSize: 13, color: 'rgba(249,250,251,0.9)' }}>{p.stat}</div>
                <div className={styles.mono} style={{ fontSize: 13, color: p.color }}>Live Demo →</div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <p className={styles.muted} style={{ fontSize: 12, lineHeight: 1.6 }}>
            Pricing in ZAR. EUR pricing available for international clients.
          </p>
        </div>

        <style>{`
          @media (max-width: 1024px) {
            #products .${styles.container} > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 768px) {
            #products .${styles.container} > div[style*="grid-template-columns"] { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </section>
  )
}
