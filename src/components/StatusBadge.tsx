import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type BadgeStatus = 'HUMAN' | 'BOT' | 'ANALYZING'

interface StatusBadgeProps {
  status: BadgeStatus
  large?: boolean
}

const config: Record<BadgeStatus, {
  label: string
  icon: LucideIcon
  classes: string
  glowClass: string
}> = {
  HUMAN: {
    label: 'HUMAN VERIFIED',
    icon: CheckCircle2,
    classes: 'border-hv-green/40 bg-hv-green/10 text-hv-green',
    glowClass: 'shadow-green-glow',
  },
  BOT: {
    label: 'BOT DETECTED',
    icon: XCircle,
    classes: 'border-hv-red/40 bg-hv-red/10 text-hv-red',
    glowClass: 'shadow-red-glow',
  },
  ANALYZING: {
    label: 'ANALYZING',
    icon: Loader2,
    classes: 'border-hv-cyan/40 bg-hv-cyan/10 text-hv-cyan',
    glowClass: 'shadow-cyan-glow-sm',
  },
}

export function StatusBadge({ status, large = false }: StatusBadgeProps) {
  const { label, icon: Icon, classes, glowClass } = config[status]
  const isAnalyzing = status === 'ANALYZING'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-bold tracking-widest uppercase',
        classes,
        glowClass,
        large ? 'px-6 py-3 text-base' : 'px-4 py-2 text-xs',
      )}
    >
      <Icon
        size={large ? 20 : 14}
        className={cn(isAnalyzing && 'animate-spin')}
      />
      {label}
    </motion.div>
  )
}
