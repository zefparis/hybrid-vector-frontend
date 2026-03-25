import { signalBus } from './SignalBus'

type VoiceSignal = {
  chunk: Blob
  timestamp: number
}

export class VoiceCollector {
  private mediaRecorder: MediaRecorder | null = null

  private mediaStream: MediaStream | null = null

  public async start(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      return
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mediaRecorder = new MediaRecorder(this.mediaStream)
    this.mediaRecorder.ondataavailable = (event: BlobEvent): void => {
      const payload: VoiceSignal = {
        chunk: event.data,
        timestamp: Date.now(),
      }

      signalBus.emit('voice', payload)
    }
    this.mediaRecorder.start(1000)
  }

  public stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    this.mediaStream?.getTracks().forEach((track) => {
      track.stop()
    })

    this.mediaRecorder = null
    this.mediaStream = null
  }
}

export const voiceCollector = new VoiceCollector()
