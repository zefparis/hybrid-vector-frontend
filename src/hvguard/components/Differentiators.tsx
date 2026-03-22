import styles from '../theme.module.css'
import { useInView } from '../hooks/useInView'

type Row = { label: string; others: boolean; hv: boolean; highlight?: boolean }

export function Differentiators() {
  const { ref, inView } = useInView<HTMLDivElement>()

  const rows: Row[] = [
    { label: 'Facial Recognition', others: true, hv: true },
    { label: 'Voice Biometrics', others: false, hv: true },
    { label: 'Cognitive Testing', others: false, hv: true },
    { label: 'Behavioral Analysis', others: false, hv: true },
    { label: 'Post-Quantum Crypto', others: false, hv: true, highlight: true },
    { label: 'Works Offline', others: false, hv: true },
    { label: 'Open-Source Core', others: false, hv: true },
    { label: '3 Patents', others: false, hv: true },
  ]

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.scanIn} ${inView ? styles.scanInVisible : ''}`}>
          <h2 className={styles.headline} style={{ fontSize: 44, lineHeight: 1.06 }}>
            What do we have more?
          </h2>
          <p className={styles.muted} style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7, maxWidth: 860 }}>
            No competitor has all 5 layers. Not Apple. Not BioCatch. Not Worldcoin.
          </p>
        </div>

        <div className={styles.tableWrap} style={{ marginTop: 22 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '46%' }}>Capability</th>
                <th className={styles.othersCol} style={{ width: '27%' }}>Others</th>
                <th className={styles.hvCol} style={{ width: '27%', color: 'var(--cyan)' }}>HV-GUARD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.label}
                  className={r.highlight ? styles.highlightRow : undefined}
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(-14px)',
                    transition: `opacity 650ms ease ${idx * 70}ms, transform 650ms ease ${idx * 70}ms`,
                  }}
                >
                  <td style={{ fontWeight: 800 }}>{r.label}</td>
                  <td className={styles.othersCol}>
                    {r.others ? (
                      <span className={styles.check}><span className={styles.checkMark}>✓</span></span>
                    ) : (
                      <span className={styles.check}><span className={styles.xMark}>✗</span></span>
                    )}
                  </td>
                  <td>
                    {r.hv ? (
                      <span className={styles.check}><span className={styles.checkMark}>✓</span></span>
                    ) : (
                      <span className={styles.check}><span className={styles.xMark}>✗</span></span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.muted} style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
          Row <b style={{ color: 'var(--amber)' }}>Post-Quantum Crypto</b> is the line that changes the game.
        </div>
      </div>
    </section>
  )
}
