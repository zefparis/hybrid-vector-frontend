import { useState } from 'react'
import styles from '../theme.module.css'
import { useInView } from '../hooks/useInView'

export function CTA() {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent('HV-GUARD Pilot Request')
    const body = encodeURIComponent(
      `Name: ${name}\nCompany: ${company}\nEmail: ${email}\n\nMessage: Requesting a pilot program for HV-GUARD.`
    )
    window.location.href = `mailto:contact@ia-solution.fr?subject=${subject}&body=${body}`
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    marginTop: '0.5rem',
    background: 'rgba(3,7,18,0.6)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '0.75rem 1rem',
    color: 'var(--white)',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.6875rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(249,250,251,0.75)',
  }

  return (
    <section id="contact" className={`${styles.section} ${styles.surface}`}>
      <div className={styles.container}>
        <div
          ref={ref}
          className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`}
          style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}
        >
          <h2 className={styles.headline}>
            Ready to eliminate identity fraud?
          </h2>
          <p className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '1rem', lineHeight: 1.7 }}>
            Join the first companies in Southern Africa using 5-layer biometric verification.
          </p>
        </div>

        <form onSubmit={submit} style={{ maxWidth: 640, margin: '1.75rem auto 0' }}>
          <div className={styles.card} style={{ background: 'rgba(17,24,39,0.55)' }}>

            <div className="ctaFormGrid">
              <div>
                <label style={labelStyle}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input value={company} onChange={e => setCompany(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <label style={labelStyle}>Email</label>
              <input value={email} type="email" onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ width: '100%', marginTop: '1rem', padding: '0.875rem 1rem' }}
              type="submit"
            >
              Request a Pilot Program →
            </button>

            <div className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '0.8125rem', lineHeight: 1.6 }}>
              Free pilot for qualifying companies. No credit card required.
              <div style={{ marginTop: '0.625rem' }}>
                Contact:{' '}
                <a href="mailto:contact@ia-solution.fr" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 800 }}>
                  contact@ia-solution.fr
                </a>
              </div>
              <div style={{ marginTop: '0.375rem' }}>Powered by IA-SOLUTION — Alès, France</div>
            </div>
          </div>
        </form>

        <style>{`
          .ctaFormGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          @media (max-width: 640px) {
            .ctaFormGrid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </section>
  )
}
