import { useRef, useCallback } from 'react'

interface Vec3 { x: number; y: number; z: number }
interface Orientation { alpha: number; beta: number; gamma: number }
interface PathPoint { x: number; y: number; t: number }

export interface MouseBehavior {
  path: PathPoint[]
  velocitySamples: number[]
  accelerationSamples: number[]
  jitterAmplitude: number
  curvilinearIndex: number
  hoverDurations: number[]
  clickOffsets: { x: number; y: number }[]
  interactionIntervals: number[]
  reactionVariance: number
}

export interface SensorData {
  accelerometer: Vec3[]
  gyroscope: Orientation[]
  touchPressure: number[]
  tapTimings: number[]
  deviceMotionVariance: number
  mouseBehavior: MouseBehavior | null
}

const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)

function variance(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
}

function stddev(values: number[]): number {
  return Math.sqrt(variance(values))
}

async function requestMotionPermission(): Promise<boolean> {
  // iOS 13+ requires explicit permission
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as any).requestPermission === 'function'
  ) {
    try {
      const permission = await (DeviceMotionEvent as any).requestPermission()
      return permission === 'granted'
    } catch {
      return false
    }
  }

  // Android / desktop — no permission needed
  return true
}

export function useSensors() {
  const accel = useRef<Vec3[]>([])
  const gyro = useRef<Orientation[]>([])
  const pressure = useRef<number[]>([])
  const taps = useRef<number[]>([])
  const active = useRef(false)

  // Mouse behavior refs (desktop only)
  const mousePath = useRef<PathPoint[]>([])
  const velocitySamples = useRef<number[]>([])
  const accelerationSamples = useRef<number[]>([])
  const hoverStarts = useRef<Map<EventTarget, number>>(new Map())
  const hoverDurations = useRef<number[]>([])
  const clickOffsets = useRef<{ x: number; y: number }[]>([])
  const clickTimestamps = useRef<number[]>([])
  const rafId = useRef<number>(0)
  const lastSample = useRef<{ x: number; y: number; t: number } | null>(null)
  const latestMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Mobile sensor handlers stored for cleanup
  const handlersRef = useRef<{
    motion?: (e: DeviceMotionEvent) => void
    orientation?: (e: DeviceOrientationEvent) => void
    mousemove?: (e: MouseEvent) => void
    mouseenter?: (e: MouseEvent) => void
    mouseleave?: (e: MouseEvent) => void
    click?: (e: MouseEvent) => void
  }>({})

  const startScan = useCallback(async () => {
    if (active.current) return
    active.current = true

    // Reset all buffers
    accel.current = []
    gyro.current = []
    pressure.current = []
    taps.current = []
    mousePath.current = []
    velocitySamples.current = []
    accelerationSamples.current = []
    hoverStarts.current.clear()
    hoverDurations.current = []
    clickOffsets.current = []
    clickTimestamps.current = []
    lastSample.current = null

    const granted = await requestMotionPermission()
    if (!granted) {
      console.log('[SENSORS] motion permission denied — mobile behavioral will use touch/tap only')
    }

    if (isMobile) {
      // Mobile: device motion + orientation
      const handleMotion = (e: DeviceMotionEvent) => {
        if (!active.current) return
        const a = e.accelerationIncludingGravity
        if (a && a.x != null && a.y != null && a.z != null) {
          accel.current.push({ x: a.x, y: a.y, z: a.z })
          if (accel.current.length > 500) accel.current.shift()
        }
      }
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (!active.current) return
        gyro.current.push({ alpha: e.alpha ?? 0, beta: e.beta ?? 0, gamma: e.gamma ?? 0 })
        if (gyro.current.length > 500) gyro.current.shift()
      }
      handlersRef.current.motion = handleMotion
      handlersRef.current.orientation = handleOrientation
      try {
        window.addEventListener('devicemotion', handleMotion, { passive: true })
        window.addEventListener('deviceorientation', handleOrientation, { passive: true })
      } catch { /* silent */ }
    } else {
      // Desktop: mouse behavior at ~60Hz via rAF
      const onMouseMove = (e: MouseEvent) => {
        latestMouse.current = { x: e.clientX, y: e.clientY }
      }

      const onMouseEnter = (e: MouseEvent) => {
        if (e.target) hoverStarts.current.set(e.target, performance.now())
      }

      const onMouseLeave = (e: MouseEvent) => {
        if (e.target && hoverStarts.current.has(e.target)) {
          const dur = performance.now() - hoverStarts.current.get(e.target)!
          hoverDurations.current.push(dur)
          hoverStarts.current.delete(e.target)
        }
      }

      const onClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null
        if (target) {
          const rect = target.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          clickOffsets.current.push({ x: e.clientX - cx, y: e.clientY - cy })
        }
        clickTimestamps.current.push(performance.now())
      }

      handlersRef.current.mousemove = onMouseMove
      handlersRef.current.mouseenter = onMouseEnter
      handlersRef.current.mouseleave = onMouseLeave
      handlersRef.current.click = onClick

      window.addEventListener('mousemove', onMouseMove, { passive: true })
      document.addEventListener('mouseenter', onMouseEnter as EventListener, { passive: true, capture: true })
      document.addEventListener('mouseleave', onMouseLeave as EventListener, { passive: true, capture: true })
      window.addEventListener('click', onClick, { passive: true })

      // 60Hz sampling loop
      const sample = () => {
        if (!active.current) return
        const now = performance.now()
        const { x, y } = latestMouse.current
        const pt: PathPoint = { x, y, t: now }
        mousePath.current.push(pt)
        if (mousePath.current.length > 2000) mousePath.current.shift()

        const prev = lastSample.current
        if (prev) {
          const dx = x - prev.x
          const dy = y - prev.y
          const dt = (now - prev.t) / 1000 // seconds
          if (dt > 0) {
            const dist = Math.sqrt(dx * dx + dy * dy)
            const vel = dist / dt
            velocitySamples.current.push(vel)
            if (velocitySamples.current.length > 2000) velocitySamples.current.shift()

            // Acceleration from last two velocities
            if (velocitySamples.current.length >= 2) {
              const prevVel = velocitySamples.current[velocitySamples.current.length - 2]
              const acc = Math.abs(vel - prevVel) / dt
              accelerationSamples.current.push(acc)
              if (accelerationSamples.current.length > 2000) accelerationSamples.current.shift()
            }
          }
        }
        lastSample.current = pt
        rafId.current = requestAnimationFrame(sample)
      }
      rafId.current = requestAnimationFrame(sample)
    }
  }, [])

  const stopScan = useCallback(() => {
    active.current = false

    if (isMobile) {
      try {
        if (handlersRef.current.motion)
          window.removeEventListener('devicemotion', handlersRef.current.motion)
        if (handlersRef.current.orientation)
          window.removeEventListener('deviceorientation', handlersRef.current.orientation)
      } catch { /* silent */ }
    } else {
      cancelAnimationFrame(rafId.current)
      if (handlersRef.current.mousemove)
        window.removeEventListener('mousemove', handlersRef.current.mousemove)
      if (handlersRef.current.mouseenter)
        document.removeEventListener('mouseenter', handlersRef.current.mouseenter as EventListener, true)
      if (handlersRef.current.mouseleave)
        document.removeEventListener('mouseleave', handlersRef.current.mouseleave as EventListener, true)
      if (handlersRef.current.click)
        window.removeEventListener('click', handlersRef.current.click)
    }
    handlersRef.current = {}
  }, [])

  const recordTap = useCallback((pointerPressure?: number) => {
    taps.current.push(performance.now())
    if (pointerPressure != null && pointerPressure > 0) {
      pressure.current.push(pointerPressure)
    }
  }, [])

  const getSnapshot = useCallback((): SensorData => {
    const magnitudes = accel.current.map((v) => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2))

    let mouseBehavior: MouseBehavior | null = null

    if (!isMobile && mousePath.current.length > 1) {
      // Jitter: stddev of micro-movements (< 3px displacement)
      const microMoves: number[] = []
      for (let i = 1; i < mousePath.current.length; i++) {
        const dx = mousePath.current[i].x - mousePath.current[i - 1].x
        const dy = mousePath.current[i].y - mousePath.current[i - 1].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 3 && d > 0) microMoves.push(d)
      }
      const jitterAmplitude = stddev(microMoves)

      // Curvilinear index: actual path length / straight line distance
      let actualLength = 0
      for (let i = 1; i < mousePath.current.length; i++) {
        const dx = mousePath.current[i].x - mousePath.current[i - 1].x
        const dy = mousePath.current[i].y - mousePath.current[i - 1].y
        actualLength += Math.sqrt(dx * dx + dy * dy)
      }
      const first = mousePath.current[0]
      const last = mousePath.current[mousePath.current.length - 1]
      const straightLine = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2)
      const curvilinearIndex = straightLine > 0 ? actualLength / straightLine : 1

      // Interaction intervals between clicks
      const interactionIntervals: number[] = []
      for (let i = 1; i < clickTimestamps.current.length; i++) {
        interactionIntervals.push(clickTimestamps.current[i] - clickTimestamps.current[i - 1])
      }

      // Reaction variance = stddev of interaction intervals
      const reactionVariance = stddev(interactionIntervals)

      mouseBehavior = {
        path: [...mousePath.current],
        velocitySamples: [...velocitySamples.current],
        accelerationSamples: [...accelerationSamples.current],
        jitterAmplitude,
        curvilinearIndex,
        hoverDurations: [...hoverDurations.current],
        clickOffsets: [...clickOffsets.current],
        interactionIntervals,
        reactionVariance,
      }
    }

    const sensorData: SensorData = {
      accelerometer: [...accel.current],
      gyroscope: [...gyro.current],
      touchPressure: [...pressure.current],
      tapTimings: [...taps.current],
      deviceMotionVariance: variance(magnitudes),
      mouseBehavior,
    }

    console.log('[SENSORS] accelerometer samples:', sensorData.accelerometer?.length ?? 0)
    console.log('[SENSORS] gyroscope samples:', sensorData.gyroscope?.length ?? 0)
    console.log('[SENSORS] touch pressure samples:', sensorData.touchPressure?.length ?? 0)
    console.log('[SENSORS] tap timings:', sensorData.tapTimings?.length ?? 0)
    console.log(
      '[SENSORS] mouse behavior:',
      sensorData.mouseBehavior
        ? `path=${sensorData.mouseBehavior.path?.length}, jitter=${sensorData.mouseBehavior.jitterAmplitude}`
        : 'null (mobile)'
    )
    console.log('[SENSORS] deviceMotionVariance:', sensorData.deviceMotionVariance)

    return sensorData
  }, [])

  return { recordTap, getSnapshot, startScan, stopScan, isMobile }
}
