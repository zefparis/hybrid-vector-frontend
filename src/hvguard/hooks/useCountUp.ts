import { useEffect, useMemo, useState } from 'react'

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(opts: {
  enabled: boolean
  to: number
  durationMs?: number
  decimals?: number
}) {
  const durationMs = opts.durationMs ?? 1800
  const decimals = opts.decimals ?? 0
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!opts.enabled) return

    const start = performance.now()
    const from = 0

    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = easeOutCubic(t)
      const next = from + (opts.to - from) * eased
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [opts.enabled, opts.to, durationMs])

  return useMemo(() => Number(value.toFixed(decimals)), [value, decimals])
}
