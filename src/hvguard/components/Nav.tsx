import { useEffect, useMemo, useState, useRef } from 'react'
import styles from '../theme.module.css'

type NavLink = { label: string; href: string }

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const burger = document.querySelector(`.${styles.burger}`)
        if (burger && !burger.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  function scrollTo(hash: string) {
    setIsOpen(false)
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
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(o => !o)}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      <div ref={menuRef} className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ''}`}>
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
