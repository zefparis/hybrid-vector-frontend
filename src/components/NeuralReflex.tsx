import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playIntercept, playError, playSuccess } from '@/utils/sounds'
import type { ReflexResult } from '@/types'
import { useT } from '@/i18n/useLang'

interface NeuralReflexProps {
  onComplete: (result: ReflexResult) => void
}

interface Signal {
  id: string
  angle: number
  distance: number
  type: 'valid' | 'noise' | 'ghost'
  spawnTime: number
  alive: boolean
}

const VALID_COUNT = 12
const NOISE_COUNT = 5
const GHOST_COUNT = 3
const GAME_DURATION = 22000
const SIGNAL_LIFETIME = 2200
const SPAWN_INTERVAL = 1200
const RADAR_SWEEP_DURATION = 2

function polarToXY(angle: number, distance: number, size: number) {
  const r = (distance / 100) * (size / 2 - 20)
  const rad = (angle * Math.PI) / 180
  return {
    x: size / 2 + r * Math.cos(rad),
    y: size / 2 + r * Math.sin(rad),
  }
}

function SignalShape({ type, intercepted }: { type: Signal['type']; intercepted: boolean }) {
  const { t } = useT()
  if (intercepted) {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full h-full flex items-center justify-center"
      >
        <span className="text-[9px] font-black tracking-wider" style={{ color: '#00FF88' }}>{t('reflex_intercepted')}</span>
      </motion.div>
    )
  }

  if (type === 'valid') {
    return (
      <svg viewBox="0 0 28 28" className="w-full h-full">
        <polygon
          points="14,2 26,8 26,20 14,26 2,20 2,8"
          fill="rgba(0,194,255,0.2)" stroke="#00C2FF" strokeWidth="1.5"
        />
        <circle cx="14" cy="14" r="3" fill="#00C2FF" />
      </svg>
    )
  }

  if (type === 'noise') {
    return (
      <svg viewBox="0 0 28 28" className="w-full h-full">
        <rect
          x="4" y="4" width="20" height="20"
          fill="rgba(255,51,85,0.15)" stroke="#FF3355" strokeWidth="1.5"
          transform="rotate(45 14 14)"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 28 28" className="w-full h-full opacity-40">
      <circle cx="14" cy="14" r="10" fill="none" stroke="#8899BB" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  )
}

function RadarGrid({ size }: { size: number }) {
  const c = size / 2
  const rings = [0.25, 0.5, 0.75, 1]
  return (
    <svg width={size} height={size} className="absolute inset-0">
      {rings.map((r) => (
        <circle
          key={r} cx={c} cy={c} r={(c - 10) * r}
          fill="none" stroke="#1E2D45" strokeWidth="0.5"
        />
      ))}
      {[0, 45, 90, 135].map((a) => {
        const rad = (a * Math.PI) / 180
        const len = c - 10
        return (
          <line
            key={a}
            x1={c + len * Math.cos(rad)} y1={c + len * Math.sin(rad)}
            x2={c - len * Math.cos(rad)} y2={c - len * Math.sin(rad)}
            stroke="#1E2D45" strokeWidth="0.5"
          />
        )
      })}
    </svg>
  )
}

function CompletionScreen({ result }: { result: ReflexResult }) {
  const { t } = useT()
  const velocityLabel =
    result.avgVelocityMs < 350 ? t('reflex_velocity_exceptional') :
      result.avgVelocityMs < 500 ? t('reflex_velocity_optimal') : t('reflex_velocity_standard')

  const lines = [
    `${result.intercepted}/${result.total} ${t('reflex_intercepted').toLowerCase()}`,
    `${t('reflex_velocity')}: ${result.avgVelocityMs}ms \u2014 ${velocityLabel}`,
    `${t('reflex_false_positive_rate')}: ${result.falsePositives > 0 ? result.falsePositives : '0'}%`,
    t('reflex_complete_locked').replace('✓ ', ''),
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 py-4">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest" style={{ color: '#00FF88' }}>
          {t('reflex_complete_title')}
        </p>
        <div className="h-px w-full mt-3" style={{ backgroundColor: '#1E2D45' }} />
      </div>
      <div className="space-y-2.5 py-2">
        {lines.map((line, i) => (
          <motion.div
            key={line}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 + 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-2.5"
          >
            <span className="text-xs" style={{ color: '#00FF88' }}>✓</span>
            <span className="text-xs font-semibold tracking-wider" style={{ color: '#F0F4FF' }}>
              {line}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export function NeuralReflex({ onComplete }: NeuralReflexProps) {
  const { t } = useT()
  const [signals, setSignals] = useState<Signal[]>([])
  const [interceptedIds, setInterceptedIds] = useState<Set<string>>(new Set())
  const [errorFlash, setErrorFlash] = useState(false)
  const [interceptedCount, setInterceptedCount] = useState(0)
  const [avgVelocity, setAvgVelocity] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [gameState, setGameState] = useState<'playing' | 'done'>('playing')
  const [result, setResult] = useState<ReflexResult | null>(null)

  const velocities = useRef<number[]>([])
  const falsePos = useRef(0)
  const spawnedValid = useRef(0)
  const spawnedNoise = useRef(0)
  const spawnedGhost = useRef(0)
  const gameStart = useRef(performance.now())
  const signalIdCounter = useRef(0)

  const radarSize = typeof window !== 'undefined'
    ? Math.min(360, Math.max(260, window.innerWidth * 0.8))
    : 320

  const finishGame = useCallback(() => {
    if (gameState === 'done') return
    setGameState('done')
    const avg = velocities.current.length > 0
      ? Math.round(velocities.current.reduce((a, b) => a + b, 0) / velocities.current.length)
      : 999
    const totalFP = falsePos.current
    const res: ReflexResult = {
      intercepted: interceptedCount,
      total: VALID_COUNT,
      avgVelocityMs: avg,
      falsePositives: totalFP,
      accuracy: Math.round((interceptedCount / VALID_COUNT) * 100),
    }
    setResult(res)
    playSuccess()
    setTimeout(() => onComplete(res), 1200)
  }, [gameState, interceptedCount, onComplete])

  useEffect(() => {
    if (gameState === 'done') return
    const timer = setInterval(() => {
      const elapsed = performance.now() - gameStart.current
      const left = Math.max(0, GAME_DURATION - elapsed)
      setTimeLeft(left)
      if (left <= 0) finishGame()
    }, 100)
    return () => clearInterval(timer)
  }, [gameState, finishGame])

  useEffect(() => {
    if (gameState === 'done') return

    const spawnSignal = () => {
      const totalSpawned = spawnedValid.current + spawnedNoise.current + spawnedGhost.current
      if (totalSpawned >= VALID_COUNT + NOISE_COUNT + GHOST_COUNT) return

      let type: Signal['type'] = 'valid'
      if (spawnedValid.current >= VALID_COUNT) {
        type = spawnedNoise.current < NOISE_COUNT ? 'noise' : 'ghost'
      } else if (spawnedNoise.current < NOISE_COUNT && Math.random() < 0.25) {
        type = 'noise'
      } else if (spawnedGhost.current < GHOST_COUNT && Math.random() < 0.15) {
        type = 'ghost'
      }

      if (type === 'valid') spawnedValid.current++
      else if (type === 'noise') spawnedNoise.current++
      else spawnedGhost.current++

      signalIdCounter.current++
      const sig: Signal = {
        id: `sig-${signalIdCounter.current}`,
        angle: Math.random() * 360,
        distance: 25 + Math.random() * 60,
        type,
        spawnTime: performance.now(),
        alive: true,
      }

      setSignals((prev) => [...prev, sig])

      setTimeout(() => {
        setSignals((prev) => prev.filter((s) => s.id !== sig.id))
      }, SIGNAL_LIFETIME)
    }

    const interval = setInterval(spawnSignal, SPAWN_INTERVAL)
    spawnSignal()
    return () => clearInterval(interval)
  }, [gameState])

  useEffect(() => {
    if (interceptedCount >= VALID_COUNT && gameState === 'playing') {
      finishGame()
    }
  }, [interceptedCount, gameState, finishGame])

  const handleSignalClick = useCallback((sig: Signal) => {
    if (interceptedIds.has(sig.id) || gameState === 'done') return

    if (sig.type === 'valid') {
      const velocity = Math.round(performance.now() - sig.spawnTime)
      velocities.current.push(velocity)
      setInterceptedIds((prev) => new Set(prev).add(sig.id))
      setInterceptedCount((c) => {
        const newCount = c + 1
        return newCount
      })
      const avg = Math.round(velocities.current.reduce((a, b) => a + b, 0) / velocities.current.length)
      setAvgVelocity(avg)
      playIntercept()
    } else {
      falsePos.current++
      setErrorFlash(true)
      playError()
      setTimeout(() => setErrorFlash(false), 300)
    }
  }, [interceptedIds, gameState])

  if (result && gameState === 'done') {
    return <CompletionScreen result={result} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest mb-0.5" style={{ color: '#00C2FF' }}>
          {t('reflex_title')}
        </p>
        <p className="text-[10px] tracking-wider" style={{ color: '#8899BB' }}>
          {t('reflex_subtitle')}
        </p>
        <div className="h-px w-full mt-3" style={{ backgroundColor: '#1E2D45' }} />
      </div>

      <div
        className="relative mx-auto rounded-full overflow-hidden"
        style={{
          width: radarSize,
          height: radarSize,
          backgroundColor: '#0A0F1E',
          border: '1px solid #1E2D45',
          boxShadow: errorFlash ? '0 0 30px rgba(255,51,85,0.3)' : '0 0 20px rgba(0,194,255,0.05)',
        }}
      >
        <RadarGrid size={radarSize} />

        <motion.div
          className="absolute"
          style={{
            width: 2,
            height: radarSize / 2 - 10,
            left: radarSize / 2 - 1,
            top: 10,
            background: 'linear-gradient(180deg, transparent, rgba(0,255,136,0.6))',
            transformOrigin: `1px ${radarSize / 2 - 10}px`,
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: RADAR_SWEEP_DURATION, repeat: Infinity, ease: 'linear' }}
        />

        <div
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            left: radarSize / 2 - 4,
            top: radarSize / 2 - 4,
            backgroundColor: '#00C2FF',
            boxShadow: '0 0 10px rgba(0,194,255,0.8)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 20,
            height: 20,
            left: radarSize / 2 - 10,
            top: radarSize / 2 - 10,
            border: '1px solid rgba(0,194,255,0.3)',
          }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <AnimatePresence>
          {signals.filter((s) => s.alive).map((sig) => {
            const pos = polarToXY(sig.angle, sig.distance, radarSize)
            const isIntercepted = interceptedIds.has(sig.id)
            return (
              <motion.button
                key={sig.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute touch-manipulation"
                style={{
                  width: 44,
                  height: 44,
                  left: pos.x - 22,
                  top: pos.y - 22,
                }}
                onClick={() => handleSignalClick(sig)}
              >
                <SignalShape type={sig.type} intercepted={isIntercepted} />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold tracking-wider px-1">
        <span style={{ color: '#F0F4FF' }}>
          {t('reflex_intercepted')}: <span style={{ color: '#00C2FF' }}>{interceptedCount}/{VALID_COUNT}</span>
        </span>
        <span style={{ color: '#F0F4FF' }}>
          {t('reflex_velocity')}: <span style={{ color: '#00C2FF' }}>{avgVelocity > 0 ? `${avgVelocity}ms` : '--'}</span>
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: timeLeft < 3000 ? '#FF3355' : '#00C2FF' }}
          animate={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
      <p className="text-center text-[10px] font-semibold tracking-wider" style={{ color: '#8899BB' }}>
        {t('reflex_time')}: {Math.ceil(timeLeft / 1000)}s
      </p>

      <div className="flex justify-center gap-6 text-[9px] tracking-wider" style={{ color: '#8899BB' }}>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 28 28">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
          </svg>
          {t('reflex_valid')}
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 28 28">
            <rect x="4" y="4" width="20" height="20" fill="none" stroke="#FF3355" strokeWidth="2" transform="rotate(45 14 14)" />
          </svg>
          {t('reflex_noise')}
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="8" fill="none" stroke="#8899BB" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
          {t('reflex_ghost')}
        </div>
      </div>
    </div>
  )
}
