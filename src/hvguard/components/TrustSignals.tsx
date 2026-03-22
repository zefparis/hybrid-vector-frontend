import styles from '../theme.module.css'
import { useInView } from '../hooks/useInView'

export function TrustSignals() {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`}>
          <h2 className={styles.headline}>Trust signals</h2>
        </div>

        <div className="trustGrid" style={{ marginTop: '1.5rem' }}>
          <div
            className={`${styles.card} ${styles.fadeUp} ${inView ? styles.fadeUpVisible : ''}`}
            style={{ background: 'rgba(17,24,39,0.55)' }}
          >
            <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, fontSize: '0.9375rem' }}>Built on proven technology</div>
            <div className={styles.muted} style={{ marginTop: '0.625rem', fontSize: '0.8125rem', lineHeight: 1.7 }}>
              <div>— AWS Rekognition (facial matching)</div>
              <div>— NIST FIPS 203/204 compliant</div>
              <div>— ISO 27001 ready</div>
              <div>— GDPR compatible</div>
            </div>
          </div>

          <div
            className={`${styles.card} ${styles.fadeUp} ${inView ? styles.fadeUpVisible : ''}`}
            style={{ background: 'rgba(17,24,39,0.55)', transitionDelay: inView ? '90ms' : '0ms' }}
          >
            <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, fontSize: '0.9375rem' }}>IP Protected</div>
            <div className={styles.muted} style={{ marginTop: '0.625rem', fontSize: '0.8125rem', lineHeight: 1.7 }}>
              <div>— 3 French Patents Filed</div>
              <div className={styles.mono} style={{ marginTop: '0.625rem', color: 'rgba(249,250,251,0.85)', fontSize: '0.75rem' }}>
                FR2514274 ● FR2514546 ● FR2515560
              </div>
              <div style={{ marginTop: '0.625rem' }}>— DGA Defense Review — Cleared</div>
              <div>— Brandon IP — Paris</div>
            </div>
          </div>
        </div>

        <style>{`
          .trustGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          @media (max-width: 640px) {
            .trustGrid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </section>
  )
}
