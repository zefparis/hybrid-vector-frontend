import { useState, useEffect, useCallback, useRef } from 'react'
import * as faceapi from 'face-api.js'

let modelsLoaded = false
let modelsLoading: Promise<void> | null = null

async function ensureModelsLoaded(): Promise<void> {
  if (modelsLoaded) return
  if (modelsLoading) return modelsLoading

  modelsLoading = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ])
    modelsLoaded = true
  })()

  return modelsLoading
}

export interface FaceDetectionResult {
  score: number
  descriptor: Float32Array
}

export function useFaceApi() {
  const [loaded, setLoaded] = useState(modelsLoaded)
  const optionsRef = useRef(new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }))

  useEffect(() => {
    ensureModelsLoaded().then(() => setLoaded(true)).catch(() => {})
  }, [])

  const detectFace = useCallback(async (input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult | null> => {
    if (!loaded) return null
    const detection = await faceapi
      .detectSingleFace(input, optionsRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor()
    if (!detection) return null
    return {
      score: detection.detection.score,
      descriptor: detection.descriptor,
    }
  }, [loaded])

  const compareFaces = useCallback((d1: Float32Array, d2: Float32Array): number => {
    const distance = faceapi.euclideanDistance(
      Array.from(d1),
      Array.from(d2),
    )
    return Math.max(0, 1 - distance / 0.6)
  }, [])

  return { loaded, detectFace, compareFaces }
}
