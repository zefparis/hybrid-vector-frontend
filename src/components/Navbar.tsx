import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, LayoutDashboard, Menu, X, Home, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT, useLangStore } from '@/i18n/useLang'

export function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { t } = useT()
  const { lang, toggle } = useLangStore()

  const navLinks = [
    { to: '/', label: t('nav_home'), icon: Home },
    { to: '/edguard', label: t('nav_edguard'), icon: GraduationCap },
    { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
  ]

  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-hv-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-hv-cyan/30 bg-hv-cyan/5 group-hover:border-hv-cyan/60 transition-all duration-200">
              <Shield className="text-hv-cyan" size={18} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-sm tracking-widest text-hv-text uppercase">Hybrid</span>
              <span className="font-black text-sm tracking-widest text-hv-cyan uppercase -mt-0.5">Vector</span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.filter(l => l.to !== '/').map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link key={to} to={to} className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  active ? 'text-hv-cyan bg-hv-cyan/10' : 'text-hv-muted hover:text-hv-text hover:bg-white/5',
                )}>
                  <Icon size={15} />
                  {label}
                  {active && (
                    <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-lg border border-hv-cyan/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold tracking-widest transition-all duration-200 hover:border-hv-cyan/40 hover:text-hv-cyan"
              style={{ color: '#8899BB' }}
            >
              <span style={{ color: lang === 'fr' ? '#00C2FF' : '#8899BB' }}>FR</span>
              <span style={{ color: '#1E2D45' }}>|</span>
              <span style={{ color: lang === 'en' ? '#00C2FF' : '#8899BB' }}>EN</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hv-green/30 bg-hv-green/5">
              <div className="w-1.5 h-1.5 rounded-full bg-hv-green animate-pulse" />
              <span className="text-xs text-hv-green font-medium">{t('nav_system_online')}</span>
            </div>
            <button
              onClick={() => setOpen(o => !o)}
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-hv-muted hover:text-hv-text transition-all duration-200"
              aria-label={t('nav_toggle_menu')}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 sm:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-16 left-0 right-0 z-40 sm:hidden border-b border-white/5 bg-hv-bg/98 backdrop-blur-md"
            >
              <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
                {navLinks.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to
                  return (
                    <Link key={to} to={to} className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200',
                      active ? 'text-hv-cyan bg-hv-cyan/10 border border-hv-cyan/20' : 'text-hv-muted hover:text-hv-text hover:bg-white/5 border border-transparent',
                    )}>
                      <Icon size={17} />
                      {label}
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-hv-cyan" />}
                    </Link>
                  )
                })}
                <div className="flex items-center justify-between px-4 py-3 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-hv-green animate-pulse" />
                    <span className="text-xs text-hv-green font-medium">{t('nav_system_online')}</span>
                  </div>
                  <button
                    onClick={toggle}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold tracking-widest"
                    style={{ color: '#8899BB' }}
                  >
                    <span style={{ color: lang === 'fr' ? '#00C2FF' : '#8899BB' }}>FR</span>
                    <span style={{ color: '#1E2D45' }}>|</span>
                    <span style={{ color: lang === 'en' ? '#00C2FF' : '#8899BB' }}>EN</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
