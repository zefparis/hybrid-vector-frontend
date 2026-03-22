import styles from '../theme.module.css'

export function Footer() {
  return (
    <footer className={styles.section} style={{ paddingTop: 44, paddingBottom: 44, borderTop: '1px solid var(--border)' }}>
      <div className={styles.container} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 18 }}>
        <div>
          <div className={styles.brand}>
            <span className={styles.brandMark}>⬡</span>
            <span className={styles.brandMark}>HYBRID</span>
            <span>VECTOR</span>
          </div>
          <div className={styles.muted} style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, maxWidth: 420 }}>
            HV-GUARD family: 5-layer identity verification for South African enterprise clients.
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800 }}>Links</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a className={styles.navLink} href="#products">Products</a>
            <a className={styles.navLink} href="#how">How it works</a>
            <a className={styles.navLink} href="#contact">Contact</a>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800 }}>Patents</div>
          <div className={`${styles.muted} ${styles.mono}`} style={{ marginTop: 10, fontSize: 12, lineHeight: 1.8 }}>
            FR2514274
            <br />
            FR2514546
            <br />
            FR2515560
          </div>
          <div className={styles.muted} style={{ marginTop: 10, fontSize: 12 }}>
            © 2026 IA-SOLUTION. All rights reserved.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer .${styles.container} { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  )
}
