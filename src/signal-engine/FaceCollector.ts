import { signalBus } from './SignalBus'

type FaceSignal = {
  frame: string
  timestamp: number
}

export class FaceCollector {
  public capture(frame: string): void {
    const payload: FaceSignal = {
      frame,
      timestamp: Date.now(),
    }

    signalBus.emit('face', payload)
  }
}

export const faceCollector = new FaceCollector()
