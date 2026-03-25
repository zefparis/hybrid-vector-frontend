import { useState } from 'react'
import { GuardLauncher, type GuardConfig } from '@/components/GuardLauncher'
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
  const [selectedGuard, setSelectedGuard] = useState<GuardConfig | null>(null)

  const edguardConfig: GuardConfig = {
    id: 'edguard',
    name: 'EdGuard',
    description: 'Authentification cognitive pour examens en ligne',
    path: '/edguard',
  }

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

  const renderCardContent = (p: Product) => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, opacity: 0.18, fontSize: 36, lineHeight: 1 }}>
          {p.num}
        </div>
        <div style={{ fontSize: 20 }}>{p.icon}</div>
      </div>

      <div style={{ marginTop: '0.75rem', flex: 1 }}>
        <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, letterSpacing: '0.04em', fontSize: '0.875rem' }}>{p.name}</div>
        <div style={{ marginTop: 4, fontWeight: 700, fontSize: '0.9375rem' }}>{p.title}</div>
        <div className={styles.muted} style={{ marginTop: 8, fontSize: '0.8125rem', lineHeight: 1.6 }}>{p.desc}</div>
      </div>

      <div style={{ marginTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div className={styles.mono} style={{ fontSize: '0.75rem', color: 'rgba(249,250,251,0.9)' }}>{p.stat}</div>
        <div className={styles.mono} style={{ fontSize: '0.75rem', color: p.color, whiteSpace: 'nowrap' }}>Live Demo →</div>
      </div>
    </>
  )

  return (
    <section id="products" className={styles.section}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`}>
          <h2 className={styles.headline}>
            One identity. Five applications.
          </h2>
          <p className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '1rem', lineHeight: 1.7, maxWidth: 640 }}>
            HV-GUARD is a family of systems built on the same 5-layer identity engine.
          </p>
        </div>

        {/* Products grid — 3 cols desktop, 2 tablet, 1 mobile */}
        <div className="productsGrid" style={{ marginTop: '1.75rem' }}>
          {products.map((p, idx) => (
            p.name === 'EDGUARD' ? (
              <button
                key={p.name}
                type="button"
                onClick={() => setSelectedGuard(edguardConfig)}
                className={`${styles.card} ${styles.lift} ${p.glowClass} ${styles.fadeUp} ${inView ? styles.fadeUpVisible : ''}`}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `3px solid ${p.color}`,
                  transitionDelay: inView ? `${idx * 90}ms` : '0ms',
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  padding: 0,
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                }}
              >
                {renderCardContent(p)}
              </button>
            ) : (
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
                }}
              >
                {renderCardContent(p)}
              </a>
            )
          ))}
        </div>

        <GuardLauncher guard={selectedGuard} onClose={() => setSelectedGuard(null)} />

        <div style={{ marginTop: '1.125rem', textAlign: 'center' }}>
          <p className={styles.muted} style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
            Pricing in ZAR. EUR pricing available for international clients.
          </p>
        </div>

        <style>{`
          .productsGrid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
          @media (max-width: 1024px) {
            .productsGrid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 640px) {
            .productsGrid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </section>
  )
}
