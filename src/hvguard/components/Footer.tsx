import styles from '../theme.module.css'

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '2.75rem 0' }}>
      <div className={styles.container}>
        <div className="footerGrid">
          <div>
            <div className={styles.brand}>
              <span className={styles.brandMark}>⬡</span>
              <span className={styles.brandMark}>HYBRID</span>
              <span>VECTOR</span>
            </div>
            <div className={styles.muted} style={{ marginTop: '0.625rem', fontSize: '0.8125rem', lineHeight: 1.7, maxWidth: 360 }}>
              HV-GUARD family: 5-layer identity verification for South African enterprise clients.
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, fontSize: '0.875rem' }}>Links</div>
            <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a className={styles.navLink} href="#products">Products</a>
              <a className={styles.navLink} href="#how">How it works</a>
              <a className={styles.navLink} href="#contact">Contact</a>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, fontSize: '0.875rem' }}>Patents</div>
            <div className={`${styles.muted} ${styles.mono}`} style={{ marginTop: '0.625rem', fontSize: '0.75rem', lineHeight: 1.8 }}>
              FR2514274<br />
              FR2514546<br />
              FR2515560
            </div>
            <div className={styles.muted} style={{ marginTop: '0.625rem', fontSize: '0.75rem' }}>
              © 2026 IA-SOLUTION. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .footerGrid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 640px) {
          .footerGrid { grid-template-columns: 1fr; gap: 1.5rem; }
        }
      `}</style>
    </footer>
  )
}
