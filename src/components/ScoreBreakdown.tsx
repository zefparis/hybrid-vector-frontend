import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Brain, Shield, Sparkles, type LucideIcon } from 'lucide-react'

interface ScoreMetric {
  label: string
  value: number
  icon: LucideIcon
  color: string
  description: string
}

interface ScoreBreakdownProps {
  facialLiveness: number
  facialConfidence: number
  cognitiveScore: number
  behavioralBonus: number
}

function getBarColor(value: number): string {
  if (value >= 75) return '#00C2FF'
  if (value >= 40) return '#F97316'
  return '#EF4444'
}

function toPercent(value: number): number {
  return value <= 1 ? value * 100 : value
}

export function ScoreBreakdown({
  facialLiveness,
  facialConfidence,
  cognitiveScore,
  behavioralBonus,
}: ScoreBreakdownProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const metrics: ScoreMetric[] = [
    {
      label: 'Facial Liveness',
      value: toPercent(facialLiveness),
      icon: Eye,
      color: getBarColor(toPercent(facialLiveness)),
      description: 'Anti-spoofing liveness verification',
    },
    {
      label: 'Facial Confidence',
      value: toPercent(facialConfidence),
      icon: Shield,
      color: getBarColor(toPercent(facialConfidence)),
      description: 'Biometric match confidence',
    },
    {
      label: 'Cognitive Score',
      value: toPercent(cognitiveScore),
      icon: Brain,
      color: getBarColor(toPercent(cognitiveScore)),
      description: 'Human reaction pattern analysis',
    },
    {
      label: 'Behavioral Bonus',
      value: toPercent(behavioralBonus),
      icon: Sparkles,
      color: getBarColor(toPercent(behavioralBonus)),
      description: 'Interaction entropy factor',
    },
  ]

  return (
    <div className="w-full space-y-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-md"
                  style={{ backgroundColor: `${metric.color}18`, border: `1px solid ${metric.color}40` }}
                >
                  <Icon size={14} className="shrink-0" style={{ color: metric.color } as React.CSSProperties} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-hv-text">{metric.label}</span>
                  <p className="text-xs text-hv-muted leading-none mt-0.5">{metric.description}</p>
                </div>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: metric.color }}
              >
                {metric.value}
                <span className="text-hv-muted font-normal text-xs ml-0.5">%</span>
              </span>
            </div>

            <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: animated ? `${metric.value}%` : '0%' }}
                transition={{ delay: index * 0.12 + 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  backgroundColor: metric.color,
                  boxShadow: `0 0 8px ${metric.color}80`,
                }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
