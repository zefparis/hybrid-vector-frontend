import { useEffect, useMemo, useState } from 'react'
import styles from '../theme.module.css'

type NavLink = { label: string; href: string }

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const links = useMemo<NavLink[]>(
    () => [
      { label: 'Products', href: '#products' },
      { label: 'How it works', href: '#how' },
      { label: 'Contact', href: '#contact' },
    ],
    []
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(hash: string) {
    setOpen(false)
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`${styles.nav} ${scrolled ? styles.navGlass : ''}`}>
      <div className={`${styles.container} ${styles.navInner}`}>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            scrollTo('#top')
          }}
          className={styles.brand}
          aria-label="Hybrid Vector"
        >
          <span className={styles.brandMark}>⬡</span>
          <span className={styles.brandMark}>HYBRID</span>
          <span>VECTOR</span>
        </a>

        <div className={styles.navLinks}>
          {links.map(l => (
            <a
              key={l.href}
              className={styles.navLink}
              href={l.href}
              onClick={(e) => {
                e.preventDefault()
                scrollTo(l.href)
              }}
            >
              {l.label}
            </a>
          ))}
          <button
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => scrollTo('#contact')}
          >
            Request Demo →
          </button>
        </div>

        <button
          className={styles.burger}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      <div className={`${styles.mobileMenu} ${open ? styles.mobileMenuOpen : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {links.map(l => (
            <a
              key={l.href}
              className={styles.navLink}
              href={l.href}
              onClick={(e) => {
                e.preventDefault()
                scrollTo(l.href)
              }}
            >
              {l.label}
            </a>
          ))}
          <button
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => scrollTo('#contact')}
          >
            Request Demo →
          </button>
        </div>
      </div>
    </div>
  )
}
