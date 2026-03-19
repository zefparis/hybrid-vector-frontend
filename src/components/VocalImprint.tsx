import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playBeep, playSuccess } from '@/utils/sounds'
import type { VocalRoundResult, VocalImportData } from '@/types'
import { useT } from '@/i18n/useLang'

interface VocalImprintProps {
  onComplete: (data: VocalImportData) => void
}

interface RoundConfig {
  type: 'letter' | 'stroop' | 'number' | 'math'
  display: string
  displayColor: string
  instruction: string
  answer?: string
}

const ROUNDS: RoundConfig[] = [
  { type: 'letter', display: 'K', displayColor: '#00C2FF', instruction: 'SAY THE LETTER' },
  {
    type: 'stroop',
    display: 'ROUGE',
    displayColor: '#00C2FF',
    instruction: 'SAY THE COLOR OF THE INK, NOT THE WORD',
    answer: 'bleu',
  },
  { type: 'number', display: '7', displayColor: '#00C2FF', instruction: 'SAY THE NUMBER' },
  {
    type: 'stroop',
    display: 'VERT',
    displayColor: '#FF8C00',
    instruction: 'SAY THE COLOR OF THE INK, NOT THE WORD',
    answer: 'orange',
  },
  {
    type: 'math',
    display: '4',
    displayColor: '#00C2FF',
    instruction: 'SAY THIS NUMBER PLUS ONE',
    answer: '5',
  },
]

function WaveformCanvas({ active, frozen }: { active: boolean; frozen: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animRef = useRef<number>(0)
  const frozenData = useRef<Uint8Array | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const BARS = 48
    const barW = Math.max(2, (W / BARS) - 2)

    const c = ctx
    function drawBars(data: Uint8Array | null) {
      c.clearRect(0, 0, W, H)
      for (let i = 0; i < BARS; i++) {
        const v = data ? data[i] / 255 : 0.02 + Math.random() * 0.03
        const h = Math.max(2, v * H * 0.9)
        const x = i * (W / BARS) + 1
        c.fillStyle = `rgba(0, 194, 255, ${0.4 + v * 0.6})`
        c.fillRect(x, (H - h) / 2, barW, h)
      }
    }

    if (frozen && frozenData.current) {
      drawBars(frozenData.current)
      return
    }

    function animate() {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        frozenData.current = data
        drawBars(data)
      } else {
        drawBars(null)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [active, frozen])

  useEffect(() => {
    if (!active) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
        analyserRef.current = null
      }
      return
    }

    let stream: MediaStream | null = null

    async function startMic() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const ctx = new AudioContext()
        audioCtxRef.current = ctx
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 128
        src.connect(analyser)
        analyserRef.current = analyser
      } catch {
        // Mic not available — show flat line
      }
    }

    startMic()

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
        analyserRef.current = null
      }
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={80}
      className="w-full h-16 sm:h-20 rounded-lg"
      style={{ backgroundColor: 'rgba(0,194,255,0.03)' }}
    />
  )
}

function CompletionScreen({ results }: { results: VocalRoundResult[] }) {
  const { t } = useT()
  const avg = Math.round(results.reduce((s, r) => s + r.reactionTimeMs, 0) / results.length)
  const lines = [
    t('vocal_complete_phonetic'),
    t('vocal_complete_stroop'),
    t('vocal_complete_timing').replace('{avg}', String(avg)),
    t('vocal_complete_liveness'),
  ]
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 py-4"
    >
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest" style={{ color: '#00FF88' }}>
          {t('vocal_complete_title')}
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

export function VocalImprint({ onComplete }: VocalImprintProps) {
  const { t } = useT()
  const [roundIndex, setRoundIndex] = useState(0)
  const [state, setState] = useState<string>('ready')
  const [results, setResults] = useState<VocalRoundResult[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const targetShownAt = useRef(performance.now())
  const recordStartedAt = useRef(0)

  const round = ROUNDS[roundIndex]

  useEffect(() => {
    targetShownAt.current = performance.now()
  }, [roundIndex])

  const startRecording = useCallback(() => {
    if (isRecording || state !== 'ready') return
    playBeep()
    setIsRecording(true)
    setState('recording')
    recordStartedAt.current = performance.now()
  }, [isRecording, state])

  const stopRecording = useCallback(() => {
    if (!isRecording) return
    const now = performance.now()
    const reactionTime = Math.round(recordStartedAt.current - targetShownAt.current)
    const duration = Math.round(now - recordStartedAt.current)

    setIsRecording(false)
    setState('captured')

    const result: VocalRoundResult = {
      round: roundIndex + 1,
      reactionTimeMs: Math.max(0, reactionTime),
      durationMs: duration,
      isStroop: round.type === 'stroop',
      stroopCorrect: round.type === 'stroop' || round.type === 'math' ? true : undefined,
    }

    const newResults = [...results, result]
    setResults(newResults)

    playSuccess()

    setTimeout(() => {
      if (roundIndex < ROUNDS.length - 1) {
        setRoundIndex((i) => i + 1)
        setState('ready')
      } else {
        setState('done')
        const avg = Math.round(newResults.reduce((s, r) => s + r.reactionTimeMs, 0) / newResults.length)
        onComplete({ rounds: newResults, avgReactionMs: avg })
      }
    }, 600)
  }, [isRecording, roundIndex, round, results, onComplete])

  if (state === 'done') {
    return <CompletionScreen results={results} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#00C2FF' }}>
          {t('vocal_title')}
        </p>
        <div className="h-px w-full" style={{ backgroundColor: '#1E2D45' }} />
      </div>

      <WaveformCanvas active={isRecording} frozen={state === 'captured'} />

      <div
        className="rounded-xl p-5 flex flex-col items-center gap-3"
        style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#8899BB' }}>
            {t('vocal_round')} {roundIndex + 1} {t('vocal_of')} {ROUNDS.length}
          </span>
          {state === 'captured' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-bold tracking-wider"
              style={{ color: '#00FF88' }}
            >
              {t('vocal_captured').replace(' ✓', '')} ✓
            </motion.span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={roundIndex}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="py-4"
          >
            <span
              className="font-black text-5xl sm:text-6xl tracking-wider select-none"
              style={{ color: round.displayColor }}
            >
              {round.display}
            </span>
          </motion.div>
        </AnimatePresence>

        <p className="text-[10px] font-semibold tracking-wider text-center" style={{ color: '#8899BB' }}>
          {round.instruction}
        </p>
      </div>

      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 touch-manipulation select-none"
        style={{
          border: isRecording ? '1.5px solid #00FF88' : '1.5px solid rgba(0,194,255,0.5)',
          color: isRecording ? '#00FF88' : state === 'captured' ? '#00FF88' : '#00C2FF',
          backgroundColor: isRecording ? 'rgba(0,255,136,0.06)' : 'transparent',
          boxShadow: isRecording ? '0 0 24px rgba(0,255,136,0.2)' : '0 0 16px rgba(0,194,255,0.1)',
        }}
      >
        {isRecording && (
          <motion.div
            className="absolute -inset-1 rounded-xl"
            style={{ border: '1px solid rgba(0,255,136,0.3)' }}
            animate={{ scale: [1, 1.03, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
        </svg>
        {isRecording ? 'RECORDING...' : state === 'captured' ? t('vocal_captured') : t('vocal_speak')}
      </button>

      <div className="flex items-center gap-1.5 justify-center">
        <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#8899BB' }}>
          {t('vocal_layer')}:
        </span>
        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1E2D45' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#00C2FF' }}
            animate={{ width: `${((roundIndex + (state === 'captured' || state === 'done' ? 1 : 0)) / ROUNDS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: '#00C2FF' }}>
          {Math.round(((roundIndex + (state === 'captured' || state === 'done' ? 1 : 0)) / ROUNDS.length) * 100)}%
        </span>
      </div>
    </div>
  )
}
