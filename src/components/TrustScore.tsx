import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { SessionResult } from '@/types'
import { useT } from '@/i18n/useLang'

function scoreColor(s: number): string {
  if (s >= 75) return '#00C2FF'
  if (s >= 40) return '#FF8C00'
  return '#FF3355'
}

function scoreGlow(s: number): string {
  if (s >= 75) return 'rgba(0,194,255,0.5)'
  if (s >= 40) return 'rgba(255,140,0,0.5)'
  return 'rgba(255,51,85,0.5)'
}

function toPercent(value: number): number {
  return value <= 1 ? value * 100 : value
}

function ScoreRing({ score, size }: { score: number; size: number }) {
  const radius = 80
  const circ = 2 * Math.PI * radius
  const color = scoreColor(score)
  const glow = scoreGlow(score)

  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))
  const offset = useTransform(count, (v) => circ - (v / 100) * circ)

  useEffect(() => {
    const ctrl = animate(count, score, { duration: 1.8, ease: [0.16, 1, 0.3, 1] })
    return ctrl.stop
  }, [score, count])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#1E2D45" strokeWidth="8" />
        <motion.circle
          cx="90" cy="90" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ}
          style={{ strokeDashoffset: offset, filter: `drop-shadow(0 0 8px ${glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-black leading-none tabular-nums"
          style={{ fontSize: size * 0.28, color, textShadow: `0 0 20px ${glow}` }}
        >
          {rounded}
        </motion.span>
        <span className="text-[10px] font-semibold tracking-widest mt-0.5" style={{ color: '#8899BB' }}>
          / 100
        </span>
      </div>
      <div className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${glow.replace('0.5', '0.04')} 0%, transparent 65%)` }} />
    </div>
  )
}

function BreakdownBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const percent = toPercent(value)
  const color = scoreColor(percent)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-wider" style={{ color: '#F0F4FF' }}>
          {label}
        </span>
        <span className="text-[10px] sm:text-xs font-bold tabular-nums" style={{ color }}>
          {Math.round(percent)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

interface TrustScoreProps {
  session: SessionResult
  onReset: () => void
}

export function TrustScore({ session, onReset }: TrustScoreProps) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  const color = scoreColor(session.trust_score)
  const isHuman = session.is_human
  const ringSize = typeof window !== 'undefined' && window.innerWidth < 480 ? 160 : 200
  const breakdown = session.breakdown ?? session

  const handleShare = () => {
    const text = t('score_share_text').replace('{score}', String(session.trust_score))
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => {})
  }

  const breakdowns = [
    { label: t('score_facial'), value: breakdown.facial_confidence },
    { label: t('score_vocal'), value: breakdown.facial_liveness },
    { label: t('score_reflex'), value: breakdown.cognitive_score },
    { label: t('score_behavioral'), value: breakdown.behavioral_bonus },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-2 justify-center">
        <svg width="14" height="14" viewBox="0 0 28 28">
          <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
        </svg>
        <span className="text-xs font-bold tracking-widest" style={{ color: '#F0F4FF' }}>
          {t('score_title')}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <ScoreRing score={session.trust_score} size={ringSize} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            backgroundColor: isHuman ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,85,0.08)',
            border: `1.5px solid ${isHuman ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,85,0.3)'}`,
            boxShadow: isHuman ? '0 0 16px rgba(0,255,136,0.15)' : '0 0 16px rgba(255,51,85,0.15)',
          }}
        >
          <span className="text-sm" style={{ color: isHuman ? '#00FF88' : '#FF3355' }}>
            {isHuman ? '✓' : '✗'}
          </span>
          <span className="text-xs font-bold tracking-widest" style={{ color: isHuman ? '#00FF88' : '#FF3355' }}>
            {isHuman ? t('score_human') : t('score_bot')}
          </span>
        </motion.div>

        <span className="text-[10px] font-semibold tracking-wider" style={{ color }}>
          {t('score_confidence')}: {session.confidence_level}
        </span>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

      <div className="space-y-3">
        <p className="text-[10px] font-bold tracking-widest" style={{ color: '#8899BB' }}>
          {t('score_breakdown')}
        </p>
        {breakdowns.map((b, i) => (
          <BreakdownBar key={b.label} label={b.label} value={b.value} delay={1.8 + i * 0.2} />
        ))}
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest" style={{ color: '#8899BB' }}>
          {t('score_certified')}
        </p>
        {['ML-KEM FIPS 203/204', '3 Brevets Fran\u00e7ais', 'Celestial Entropy'].map((cert) => (
          <div key={cert} className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 28 28">
              <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
            </svg>
            <span className="text-xs font-semibold tracking-wider" style={{ color: '#F0F4FF' }}>{cert}</span>
            <span className="text-[10px] ml-auto" style={{ color: '#00FF88' }}>✓</span>
          </div>
        ))}
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />

      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 touch-manipulation"
          style={{
            backgroundColor: '#00C2FF',
            color: '#0A0F1E',
            boxShadow: '0 0 16px rgba(0,194,255,0.3)',
          }}
        >
          <span className="text-base">&#8599;</span>
          {copied ? 'COPIED ✓' : t('score_share')}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 touch-manipulation"
          style={{ border: '1.5px solid #1E2D45', color: '#8899BB' }}
        >
          {t('score_rescan')}
        </button>
      </div>
    </motion.div>
  )
}
