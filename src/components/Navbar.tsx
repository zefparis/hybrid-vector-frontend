import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, LayoutDashboard, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/demo', label: 'Live Demo', icon: Zap },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Navbar() {
  const location = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-hv-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-hv-cyan/30 bg-hv-cyan/5 group-hover:border-hv-cyan/60 group-hover:bg-hv-cyan/10 transition-all duration-200">
            <Shield className="w-4.5 h-4.5 text-hv-cyan" size={18} />
            <div className="absolute inset-0 rounded-lg bg-hv-cyan/10 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-200" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-sm tracking-widest text-hv-text uppercase">
              Hybrid
            </span>
            <span className="font-black text-sm tracking-widest text-hv-cyan uppercase -mt-0.5">
              Vector
            </span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'text-hv-cyan bg-hv-cyan/10'
                    : 'text-hv-muted hover:text-hv-text hover:bg-white/5',
                )}
              >
                <Icon size={15} />
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg border border-hv-cyan/30 bg-hv-cyan/8"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hv-green/30 bg-hv-green/5">
            <div className="w-1.5 h-1.5 rounded-full bg-hv-green animate-pulse" />
            <span className="text-xs text-hv-green font-medium">System Online</span>
          </div>
          <Link
            to="/demo"
            className="btn-primary text-sm py-2 px-4 rounded-lg font-semibold"
          >
            Try Demo
          </Link>
        </div>
      </div>
    </header>
  )
}
