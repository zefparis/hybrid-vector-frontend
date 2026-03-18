let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.12) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(vol, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration / 1000)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + duration / 1000)
  } catch {
    // Audio not available — silent fallback
  }
}

export function playBeep() {
  playTone(880, 80, 'sine', 0.08)
}

export function playSuccess() {
  try {
    const c = getCtx()
    const now = c.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.08)
      gain.gain.setValueAtTime(0.1, now + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.15)
    })
  } catch {
    // silent
  }
}

export function playError() {
  playTone(220, 200, 'sawtooth', 0.06)
  setTimeout(() => playTone(180, 250, 'sawtooth', 0.05), 120)
}

export function playScan() {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, c.currentTime)
    osc.frequency.linearRampToValueAtTime(1200, c.currentTime + 0.4)
    gain.gain.setValueAtTime(0.06, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.5)
  } catch {
    // silent
  }
}

export function playIntercept() {
  playTone(1400, 60, 'square', 0.07)
  setTimeout(() => playTone(1800, 40, 'square', 0.05), 50)
}

export function playCapture() {
  try {
    const c = getCtx()
    const now = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.linearRampToValueAtTime(1600, now + 0.05)
    osc.frequency.linearRampToValueAtTime(800, now + 0.12)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(now + 0.15)
  } catch {
    // silent
  }
}
