import { signalBus } from './SignalBus'

type CognitiveResult = {
  testId: string
  score: number
  durationMs: number
}

export class CognitiveCollector {
  public record(result: CognitiveResult): void {
    signalBus.emit('cognitive', {
      ...result,
      timestamp: Date.now(),
    })
  }
}

export const cognitiveCollector = new CognitiveCollector()
