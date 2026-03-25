type SignalBatch = unknown[]

type SignalPayload = {
  channel: string
  batch: SignalBatch
}

function sendToBackend(channel: string, batch: SignalBatch): void {
  void fetch('/api/signals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, batch } satisfies SignalPayload),
  }).catch((error: unknown) => {
    console.warn('Failed to send signals', error)
  })
}

export class SignalBus {
  private readonly buffers = new Map<string, SignalBatch>()

  private readonly flushIntervalId: number

  public constructor() {
    this.flushIntervalId = window.setInterval(() => {
      this.flush()
    }, 300)
  }

  public emit(channel: string, data: unknown): void {
    const buffer = this.buffers.get(channel)

    if (buffer) {
      buffer.push(data)
      return
    }

    this.buffers.set(channel, [data])
  }

  private flush(): void {
    for (const [channel, buffer] of this.buffers.entries()) {
      if (buffer.length === 0) {
        continue
      }

      const batch = [...buffer]
      buffer.length = 0
      sendToBackend(channel, batch)
    }
  }
}

export const signalBus = new SignalBus()
