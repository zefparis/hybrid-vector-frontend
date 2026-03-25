import { signalBus } from './SignalBus'

type BehavioralSignal = {
  type: 'mousemove' | 'keydown' | 'touchmove'
  timestamp: number
  x?: number
  y?: number
}

export class BehavioralCollector {
  private readonly onMouseMove = (event: MouseEvent): void => {
    const payload: BehavioralSignal = {
      type: 'mousemove',
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
    }

    signalBus.emit('behavioral', payload)
  }

  private readonly onKeyDown = (): void => {
    const payload: BehavioralSignal = {
      type: 'keydown',
      timestamp: Date.now(),
    }

    signalBus.emit('behavioral', payload)
  }

  private readonly onTouchMove = (event: TouchEvent): void => {
    const touch = event.touches[0]
    const payload: BehavioralSignal = {
      type: 'touchmove',
      timestamp: Date.now(),
      x: touch?.clientX,
      y: touch?.clientY,
    }

    signalBus.emit('behavioral', payload)
  }

  public start(): void {
    window.addEventListener('mousemove', this.onMouseMove, { passive: true })
    window.addEventListener('keydown', this.onKeyDown, { passive: true })
    window.addEventListener('touchmove', this.onTouchMove, { passive: true })
  }

  public stop(): void {
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('touchmove', this.onTouchMove)
  }
}

export const behavioralCollector = new BehavioralCollector()
