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

  return (
    <section id="contact" className={`${styles.section} ${styles.surface}`}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`} style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>
          <h2 className={styles.headline} style={{ fontSize: 44, lineHeight: 1.06 }}>
            Ready to eliminate
            <br />
            identity fraud?
          </h2>
          <p className={styles.muted} style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7 }}>
            Join the first companies in Southern Africa using 5-layer biometric verification.
          </p>
        </div>

        <form onSubmit={submit} style={{ maxWidth: 720, margin: '28px auto 0' }}>
          <div className={styles.card} style={{ background: 'rgba(17,24,39,0.55)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(249,250,251,0.75)' }}>
                  Name
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', marginTop: 8, background: 'rgba(3,7,18,0.6)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 12px', color: 'var(--white)', fontSize: '16px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(249,250,251,0.75)' }}>
                  Company
                </label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  required
                  style={{ width: '100%', marginTop: 8, background: 'rgba(3,7,18,0.6)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 12px', color: 'var(--white)', fontSize: '16px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(249,250,251,0.75)' }}>
                Email
              </label>
              <input
                value={email}
                type="email"
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', marginTop: 8, background: 'rgba(3,7,18,0.6)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 12px', color: 'var(--white)', fontSize: '16px' }}
              />
            </div>

            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%', marginTop: 16, padding: '14px 16px' }} type="submit">
              Request a Pilot Program →
            </button>

            <div className={styles.muted} style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
              Free pilot for qualifying companies. No credit card required.
              <div style={{ marginTop: 10 }}>
                Contact: <a href="mailto:contact@ia-solution.fr" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 800 }}>contact@ia-solution.fr</a>
              </div>
              <div style={{ marginTop: 6 }}>Powered by IA-SOLUTION — Alès, France</div>
            </div>
          </div>
        </form>

        <style>{`
          @media (max-width: 768px) {
            #contact form .${styles.card} > div[style*="grid-template-columns"] { grid-template-columns: 1fr; }
            #contact form input { font-size: 16px; }
          }
        `}</style>
      </div>
    </section>
  )
}
