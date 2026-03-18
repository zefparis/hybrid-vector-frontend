import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Play, CheckCircle2 } from 'lucide-react'
import type { CognitiveTestResult, CognitiveRound, CognitiveCircle } from '@/types'

interface CognitiveTestProps {
  onComplete: (result: CognitiveTestResult) => void
}

const TOTAL_ROUNDS = 5
const ROUND_DURATION = 2200

function generateRound(): CognitiveRound {
  const numCircles = 2 + Math.floor(Math.random() * 2)
  const greenIndex = Math.floor(Math.random() * numCircles)
  const positions: Array<{ x: number; y: number }> = []

  const circles: CognitiveCircle[] = Array.from({ length: numCircles }, (_, i) => {
    let x: number
    let y: number
    let attempts = 0
    do {
      x = 10 + Math.random() * 72
      y = 8 + Math.random() * 65
      attempts++
    } while (
      attempts < 20 &&
      positions.some((p) => Math.hypot(p.x - x, p.y - y) < 22)
    )
    positions.push({ x, y })
    return {
      id: `${i}-${Math.random()}`,
      x,
      y,
      isGreen: i === greenIndex,
    }
  })

  return { circles }
}

function generateAllRounds(): CognitiveRound[] {
  return Array.from({ length: TOTAL_ROUNDS }, generateRound)
}

export function CognitiveTest({ onComplete }: CognitiveTestProps) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'complete'>('idle')
  const [roundIndex, setRoundIndex] = useState(0)
  const [rounds] = useState<CognitiveRound[]>(() => generateAllRounds())
  const [progress, setProgress] = useState(100)
  const [clickedIds, setClickedIds] = useState<Set<string>>(new Set())

  const correctClicksRef = useRef(0)
  const reactionTimesRef = useRef<number[]>([])
  const roundStartRef = useRef(0)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current)
  }, [])

  const finishTest = useCallback(() => {
    const correct = correctClicksRef.current
    const times = reactionTimesRef.current
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 1500
    const speedFactor = Math.max(0.4, Math.min(1, 1 - (avgTime - 250) / 2000))
    const score = Math.round((correct / TOTAL_ROUNDS) * 100 * speedFactor)

    onComplete({
      session_id: crypto.randomUUID(),
      score: Math.min(100, Math.max(0, score)),
      correct_clicks: correct,
      total_rounds: TOTAL_ROUNDS,
      avg_reaction_time_ms: Math.round(avgTime),
    })
    setPhase('complete')
  }, [onComplete])

  const advanceRound = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= TOTAL_ROUNDS) {
        finishTest()
        return
      }
      setRoundIndex(nextIndex)
      setClickedIds(new Set())
      setProgress(100)
      roundStartRef.current = Date.now()
    },
    [finishTest],
  )

  useEffect(() => {
    if (phase !== 'running') return

    roundStartRef.current = Date.now()
    setProgress(100)
    setClickedIds(new Set())

    const startedAt = Date.now()
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt
      setProgress(Math.max(0, 100 - (elapsed / ROUND_DURATION) * 100))
    }, 40)

    roundTimerRef.current = setTimeout(() => {
      clearTimers()
      const next = roundIndex + 1
      if (next >= TOTAL_ROUNDS) {
        finishTest()
      } else {
        advanceRound(next)
      }
    }, ROUND_DURATION)

    return clearTimers
  }, [phase, roundIndex, advanceRound, finishTest, clearTimers])

  const handleCircleClick = useCallback(
    (circle: CognitiveCircle) => {
      if (clickedIds.has(circle.id)) return
      setClickedIds((prev) => new Set([...prev, circle.id]))

      if (circle.isGreen) {
        const reactionMs = Date.now() - roundStartRef.current
        reactionTimesRef.current.push(reactionMs)
        correctClicksRef.current += 1

        clearTimers()
        const next = roundIndex + 1
        if (next >= TOTAL_ROUNDS) {
          setTimeout(finishTest, 300)
        } else {
          setTimeout(() => advanceRound(next), 300)
        }
      }
    },
    [clickedIds, roundIndex, clearTimers, advanceRound, finishTest],
  )

  const startTest = () => {
    correctClicksRef.current = 0
    reactionTimesRef.current = []
    setRoundIndex(0)
    setPhase('running')
  }

  if (phase === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8"
      >
        <div className="w-16 h-16 rounded-full bg-hv-green/10 border border-hv-green/30 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-hv-green" />
        </div>
        <p className="text-hv-text font-semibold">Cognitive test complete</p>
        <p className="text-hv-muted text-sm">Proceeding to analysis...</p>
      </motion.div>
    )
  }

  if (phase === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6 py-4"
      >
        <div className="w-16 h-16 rounded-full bg-hv-cyan/10 border border-hv-cyan/30 flex items-center justify-center">
          <Brain size={30} className="text-hv-cyan" />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h3 className="text-hv-text font-bold text-lg">Cognitive Challenge</h3>
          <p className="text-hv-muted text-sm leading-relaxed">
            {TOTAL_ROUNDS} rounds will appear. Click{' '}
            <span className="text-hv-green font-semibold">green circles</span> as fast as possible.
            Ignore <span className="text-hv-red font-semibold">red circles</span>.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {[
            { label: 'Rounds', value: String(TOTAL_ROUNDS) },
            { label: 'Duration', value: '2s each' },
            { label: 'Target', value: 'Green only' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="glass rounded-xl p-3 text-center"
            >
              <div className="text-hv-cyan font-bold text-sm">{value}</div>
              <div className="text-hv-muted text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={startTest}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm bg-hv-cyan text-hv-bg cyan-glow hover:bg-hv-cyan-dark transition-all duration-200"
        >
          <Play size={16} fill="currentColor" />
          Start Test
        </button>
      </motion.div>
    )
  }

  const currentRound = rounds[roundIndex]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-hv-muted">
          Round <span className="text-hv-cyan font-bold">{roundIndex + 1}</span> / {TOTAL_ROUNDS}
        </span>
        <span className="text-hv-muted font-medium">
          Click the <span className="text-hv-green font-bold">green</span> circle
        </span>
      </div>

      <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-hv-cyan"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.04 }}
        />
      </div>

      <div
        className="relative rounded-2xl border border-white/5 bg-hv-surface overflow-hidden select-none"
        style={{ height: 'clamp(220px, 40vw, 280px)' }}
      >
        <div className="absolute inset-0 grid-bg opacity-40" />

        <AnimatePresence mode="wait">
          <motion.div
            key={roundIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
          >
            {currentRound.circles.map((circle) => {
              const isClicked = clickedIds.has(circle.id)
              const isGreen = circle.isGreen

              return (
                <motion.button
                  key={circle.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isClicked ? 1.3 : 1, opacity: isClicked ? 0 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => handleCircleClick(circle)}
                  className="absolute w-14 h-14 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation"
                  style={{
                    left: `${circle.x}%`,
                    top: `${circle.y}%`,
                    backgroundColor: isGreen
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                    borderColor: isGreen ? '#22C55E' : '#EF4444',
                    boxShadow: isGreen
                      ? '0 0 16px rgba(34,197,94,0.5)'
                      : '0 0 16px rgba(239,68,68,0.4)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: isGreen ? '#22C55E' : '#EF4444',
                    }}
                  />
                </motion.button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                i < roundIndex
                  ? '#22C55E'
                  : i === roundIndex
                    ? '#00C2FF'
                    : 'rgba(255,255,255,0.1)',
              boxShadow:
                i === roundIndex ? '0 0 6px rgba(0,194,255,0.8)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  )
}
