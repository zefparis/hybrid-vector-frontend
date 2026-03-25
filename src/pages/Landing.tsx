import { motion } from 'framer-motion'
import { ArrowRight, Shield, Brain, Lock, ChevronRight, Fingerprint, Cpu, Zap } from 'lucide-react'
import { useMemo } from 'react'
import { useT } from '@/i18n/useLang'

const PARTICLE_COUNT = 40

interface Particle {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: (i / PARTICLE_COUNT) * 100 + (Math.sin(i * 2.3) * 5),
    delay: (i * 0.37) % 15,
    duration: 14 + (i % 8) * 1.5,
    size: 1 + (i % 3),
    opacity: 0.15 + (i % 5) * 0.08,
  }))
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

const EDGUARD_URL = 'https://edguard-v2.vercel.app'

export function Landing() {
  const { t } = useT()
  const particles = useMemo(generateParticles, [])

  const openEdguard = () => {
    window.location.href = EDGUARD_URL
  }

  const features = [
    {
      icon: Fingerprint,
      title: t('landing_feature_face_title'),
      description: t('landing_feature_face_desc_long'),
      badge: 'PATENT FR-2024-001',
      color: '#00C2FF',
    },
    {
      icon: Brain,
      title: t('landing_feature_cognitive_title'),
      description: t('landing_feature_cognitive_desc_long'),
      badge: 'PATENT FR-2024-002',
      color: '#a78bfa',
    },
    {
      icon: Lock,
      title: t('landing_feature_pqc_title'),
      description: t('landing_feature_pqc_desc_long'),
      badge: 'PATENT FR-2024-003',
      color: '#34d399',
    },
  ]
  const stats = [
    { value: '100%', label: t('landing_stats_agent'), sublabel: t('landing_stats_agent_sub'), icon: Shield },
    { value: '3', label: t('landing_stats_patents'), sublabel: t('landing_stats_patents_sub'), icon: Cpu },
    { value: '<500ms', label: t('landing_stats_time'), sublabel: t('landing_stats_time_sub'), icon: Zap },
  ]

  return (
    <div className="min-h-screen bg-hv-bg overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 radial-glow-center" />
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 rounded-full bg-hv-cyan"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 40 - 20}px); opacity: 0; }
        }
      `}</style>

      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border-hv-cyan/20">
              <div className="w-1.5 h-1.5 rounded-full bg-hv-cyan animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-hv-cyan uppercase">
                {t('landing_platform_tag')}
              </span>
              <ChevronRight size={12} className="text-hv-muted" />
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-black text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight"
          >
            <span className="text-gradient-white block">{t('landing_hero_title').split(' ').slice(0, -2).join(' ')}</span>
            <span className="text-gradient-cyan block mt-1">{t('landing_hero_title').split(' ').slice(-2).join(' ')}</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-hv-muted text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            {t('landing_hero_subtitle')}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openEdguard}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base bg-hv-cyan text-hv-bg transition-all duration-200 hover:bg-hv-cyan-dark"
              style={{ boxShadow: '0 0 24px rgba(0,194,255,0.45), 0 0 48px rgba(0,194,255,0.2)' }}
            >
              {t('landing_cta')}
              <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base border border-white/10 text-hv-muted hover:text-hv-text hover:border-white/20 transition-all duration-200"
            >
              {t('landing_learn_more')}
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-x-8 gap-y-3 pt-4">
            {[
              t('landing_enterprise_security'),
              t('landing_gdpr_compliant'),
              t('landing_on_premise'),
              t('landing_rest_api'),
            ].map((tag) => (
              <div key={tag} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-hv-cyan" />
                <span className="text-xs text-hv-muted font-medium">{tag}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative mt-20 w-full max-w-3xl mx-auto px-4"
        >
          <div
            className="glass rounded-2xl border border-hv-cyan/10 p-6 sm:p-8"
            style={{ boxShadow: '0 0 60px rgba(0,194,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-hv-red/70" />
              <div className="w-3 h-3 rounded-full bg-hv-orange/70" />
              <div className="w-3 h-3 rounded-full bg-hv-green/70" />
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-1 rounded-md bg-white/5 text-xs text-hv-muted font-mono truncate max-w-[180px] sm:max-w-none">
                  https://hybrid-vector-api.fly.dev
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3">
              {[
                { step: '01', label: 'Face Capture', icon: Fingerprint, status: 'complete' },
                { step: '02', label: 'Cognitive Test', icon: Brain, status: 'complete' },
                { step: '03', label: 'Trust Score', icon: Shield, status: 'active' },
              ].map(({ step, label, icon: Icon, status }) => (
                <div
                  key={step}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: status === 'active' ? 'rgba(0,194,255,0.3)' : 'rgba(255,255,255,0.06)',
                    backgroundColor: status === 'active' ? 'rgba(0,194,255,0.06)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: status === 'active' ? 'rgba(0,194,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${status === 'active' ? 'rgba(0,194,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <Icon
                      size={18}
                      style={{ color: status === 'active' ? '#00C2FF' : '#9CA3AF' }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-hv-muted font-mono">{step}</div>
                    <div
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: status === 'active' ? '#F9FAFB' : '#9CA3AF' }}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-hv-bg border border-white/5 font-mono text-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-hv-green">✓</span>
                <span className="text-hv-muted">{t('landing_trust_score_computed')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-hv-cyan font-bold text-2xl">87</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-hv-green text-xs font-bold">HUMAN VERIFIED ✓</span>
                  <span className="text-hv-muted text-xs">Confidence: HIGH · 412ms</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-semibold tracking-widest text-hv-muted uppercase">
              {t('landing_core_technology')}
            </div>
            <h2 className="font-black text-3xl sm:text-4xl text-gradient-white">
              {t('landing_three_layers')}
            </h2>
            <p className="text-hv-muted max-w-xl mx-auto">
              {t('landing_three_layers_desc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="glass-hover rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${feature.color}18`,
                        border: `1px solid ${feature.color}30`,
                      }}
                    >
                      <Icon size={22} style={{ color: feature.color }} />
                    </div>
                    <span
                      className="text-xs font-bold tracking-wider px-2 py-1 rounded-md"
                      style={{
                        color: feature.color,
                        backgroundColor: `${feature.color}12`,
                        border: `1px solid ${feature.color}20`,
                      }}
                    >
                      {feature.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-hv-text text-lg">{feature.title}</h3>
                    <p className="text-hv-muted text-sm mt-2 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-8 sm:p-12 border border-hv-cyan/10"
            style={{ boxShadow: '0 0 80px rgba(0,194,255,0.05)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x sm:divide-white/5">
              {stats.map(({ value, label, sublabel, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex flex-col items-center text-center px-6 space-y-2"
                >
                  <Icon size={24} className="text-hv-cyan mb-1" />
                  <div className="font-black text-4xl sm:text-5xl text-gradient-cyan">{value}</div>
                  <div className="text-hv-text font-semibold text-sm">{label}</div>
                  <div className="text-hv-muted text-xs">{sublabel}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="font-black text-3xl sm:text-4xl text-gradient-white">
              {t('landing_experience_live')}
            </h2>
            <p className="text-hv-muted">
              {t('landing_experience_live_desc')}
            </p>
            <button
              onClick={openEdguard}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base bg-hv-cyan text-hv-bg hover:bg-hv-cyan-dark transition-all duration-200"
              style={{ boxShadow: '0 0 24px rgba(0,194,255,0.45)' }}
            >
              {t('landing_start_verification')}
              <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="relative border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-hv-muted">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-hv-cyan" />
            <span className="font-bold text-hv-text">Hybrid Vector</span>
            <span>— {t('landing_hero_title')}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <span>{t('landing_footer_patents')}</span>
            <span>{t('landing_footer_gdpr')}</span>
            <span>{t('landing_footer_soc2')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
