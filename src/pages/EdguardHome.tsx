import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

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
  return (
    <div className="min-h-screen pt-16 pb-12 px-3 sm:px-4 overflow-x-hidden" style={{ background: 'radial-gradient(circle at top, rgba(0,194,255,0.12), transparent 35%), #0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="max-w-5xl mx-auto relative w-full pt-10 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-5" style={{ border: '1px solid rgba(0,194,255,0.18)', backgroundColor: 'rgba(0,194,255,0.06)', color: '#7DDFFF' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00C2FF' }} />
            <span className="text-[11px] font-semibold tracking-[0.28em] uppercase">Exam Integrity Platform</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <HexIcon />
            <h1 className="text-3xl sm:text-5xl font-black tracking-widest" style={{ color: '#00C2FF' }}>
              EDGUARD
            </h1>
          </div>
          <p className="text-sm sm:text-base font-bold tracking-[0.24em] uppercase mb-3" style={{ color: '#F0F4FF' }}>
            Academic Identity Shield
          </p>
          <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: '#9FB0D1' }}>
            Protect online exams with face verification, secure enrollment, and fast access to student identity checks.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {[
            { value: '2 min', label: 'Average setup time' },
            { value: 'Live', label: 'Face capture and validation' },
            { value: '24/7', label: 'Exam access readiness' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-5 text-center"
              style={{ backgroundColor: 'rgba(13,21,38,0.92)', border: '1px solid rgba(30,45,69,1)' }}
            >
              <div className="text-2xl font-black" style={{ color: '#00C2FF' }}>{item.value}</div>
              <div className="text-sm mt-2" style={{ color: '#93A5C7' }}>{item.label}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link to="/edguard/enroll" className="block group" style={{ textDecoration: 'none' }}>
              <div
                className="rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#00C2FF]/50"
                style={{ background: 'linear-gradient(180deg, rgba(13,21,38,0.98), rgba(10,15,30,0.98))', border: '1px solid #1E2D45', minHeight: 320 }}
              >
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(0,194,255,0.14)' }} />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}>
                    <UserScanIcon />
                  </div>
                  <span className="text-[11px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#6ED8FF' }}>Enrollment</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3" style={{ color: '#F0F4FF' }}>
                  Student Enrollment
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#94A6C9' }}>
                  Register a student profile with identity details, a live selfie, and the baseline data required before an exam session starts.
                </p>
                <div className="space-y-2 mb-7">
                  {['Identity form and student details', 'Live selfie capture', 'Ready for future verification'].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm" style={{ color: '#C9D6EE' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00C2FF' }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,194,255,0.2)]"
                  style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF', backgroundColor: 'rgba(0,194,255,0.06)' }}
                >
                  Start Enrollment →
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link to="/edguard/verify" className="block group" style={{ textDecoration: 'none' }}>
              <div
                className="rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#00C2FF]/50"
                style={{ background: 'linear-gradient(180deg, rgba(13,21,38,0.98), rgba(10,15,30,0.98))', border: '1px solid #1E2D45', minHeight: 320 }}
              >
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(0,194,255,0.14)' }} />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}>
                    <ShieldCheckIcon />
                  </div>
                  <span className="text-[11px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#6ED8FF' }}>Verification</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3" style={{ color: '#F0F4FF' }}>
                  Identity Verification
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#94A6C9' }}>
                  Confirm a returning student using their first name, last name, and a fresh live selfie before granting access to the exam flow.
                </p>
                <div className="space-y-2 mb-7">
                  {['Fast student lookup', 'Face match confirmation', 'Immediate session access'].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm" style={{ color: '#C9D6EE' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00C2FF' }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,194,255,0.2)]"
                  style={{ border: '1.5px solid rgba(0,194,255,0.5)', color: '#00C2FF', backgroundColor: 'rgba(0,194,255,0.06)' }}
                >
                  Start Verification →
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mt-6 rounded-3xl p-6 sm:p-7"
          style={{ backgroundColor: 'rgba(13,21,38,0.82)', border: '1px solid rgba(30,45,69,1)' }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Built for mobile', desc: 'Students can enroll and verify directly from their phone browser.' },
              { title: 'Clear exam flow', desc: 'Enrollment and verification are separated into two simple entry points.' },
              { title: 'Ready to install', desc: 'Use the launcher modal to open or install the app as a PWA.' },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-bold tracking-[0.18em] uppercase mb-2" style={{ color: '#EAF2FF' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#92A4C5' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
