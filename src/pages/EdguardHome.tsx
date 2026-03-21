import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useT } from '@/i18n/useLang'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

function HexIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 28 28">
      <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="4" fill="#00C2FF" opacity="0.6" />
    </svg>
  )
}

function UserScanIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v4h0a8 8 0 0 1 16 0v0h0v-4" />
      <path d="M2 20v-4h0a8 8 0 0 0 16 0v0h0v4" />
      <circle cx="10" cy="10" r="3" />
      <path d="M10 13a5 5 0 0 0-5 5" />
      <path d="M10 13a5 5 0 0 1 5 5" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

export function EdguardHome() {
  const { t } = useT()

  return (
    <div className="min-h-screen pt-16 pb-12 px-3 sm:px-4 overflow-x-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="max-w-2xl mx-auto relative w-full pt-10 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-10 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <HexIcon />
            <h1 className="text-3xl sm:text-5xl font-black tracking-widest" style={{ color: '#00C2FF' }}>
              {t('edguard_title')}
            </h1>
          </div>
          <p className="text-sm sm:text-base font-bold tracking-widest mb-3" style={{ color: '#F0F4FF' }}>
            {t('edguard_subtitle')}
          </p>
          <p className="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed" style={{ color: '#8899BB' }}>
            Choisissez un parcours pour enregistrer ou vérifier une identité faciale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link to="/edguard/enroll" className="block group">
              <div
                className="rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 group-hover:border-[#00C2FF]/50"
                style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}>
                    <UserScanIcon />
                  </div>
                </div>
                <h2 className="text-base sm:text-lg font-bold tracking-wider mb-2" style={{ color: '#F0F4FF' }}>
                  {t('edguard_enroll')}
                </h2>
                <p className="text-xs leading-relaxed mb-5" style={{ color: '#8899BB' }}>
                  Commencer l’enregistrement avec formulaire d’identité puis selfie
                </p>
                <div
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,194,255,0.2)]"
                  style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF' }}
                >
                  Démarrer l’enregistrement →
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link to="/edguard/verify" className="block group">
              <div
                className="rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 group-hover:border-[#00C2FF]/50"
                style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}>
                    <ShieldCheckIcon />
                  </div>
                </div>
                <h2 className="text-base sm:text-lg font-bold tracking-wider mb-2" style={{ color: '#F0F4FF' }}>
                  Vérification d’identité
                </h2>
                <p className="text-xs leading-relaxed mb-5" style={{ color: '#8899BB' }}>
                  Vérifier une identité existante avec prénom, nom et selfie
                </p>
                <div
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,194,255,0.2)]"
                  style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF' }}
                >
                  Démarrer la vérification →
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
