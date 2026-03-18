import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface TrustScoreProps {
  score: number
  size?: number
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#00C2FF'
  if (score >= 40) return '#F97316'
  return '#EF4444'
}

function getScoreLabel(score: number): string {
  if (score >= 75) return 'Trusted'
  if (score >= 40) return 'Uncertain'
  return 'High Risk'
}

function getGlowColor(score: number): string {
  if (score >= 75) return 'rgba(0, 194, 255, 0.5)'
  if (score >= 40) return 'rgba(249, 115, 22, 0.5)'
  return 'rgba(239, 68, 68, 0.5)'
}

export function TrustScore({ score, size = 220 }: TrustScoreProps) {
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const color = getScoreColor(score)
  const label = getScoreLabel(score)
  const glowColor = getGlowColor(score)

  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))
  const strokeDashoffset = useTransform(
    count,
    (v) => circumference - (v / 100) * circumference,
  )

  const svgRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
  }, [score, count])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="10"
          />
          <motion.circle
            ref={svgRef}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset,
              filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`,
            }}
          />
        </svg>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}
        >
          <motion.span
            className="font-black leading-none"
            style={{
              fontSize: size * 0.22,
              color,
              textShadow: `0 0 20px ${glowColor}`,
            }}
          >
            {rounded}
          </motion.span>
          <span
            className="font-semibold tracking-widest uppercase mt-1"
            style={{ fontSize: size * 0.065, color: 'rgba(255,255,255,0.5)' }}
          >
            / 100
          </span>
          <span
            className="font-bold tracking-wider uppercase mt-2"
            style={{ fontSize: size * 0.07, color }}
          >
            {label}
          </span>
        </div>

        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor.replace('0.5', '0.06')} 0%, transparent 65%)`,
          }}
        />
      </div>
    </div>
  )
}
