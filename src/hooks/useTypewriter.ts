import { useState, useEffect, useRef } from 'react'

export function useTypewriter(text: string, speed = 40, startDelay = 0): string {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0

    const delayTimer = setTimeout(() => {
      const interval = setInterval(() => {
        indexRef.current += 1
        if (indexRef.current > text.length) {
          clearInterval(interval)
          return
        }
        setDisplayed(text.slice(0, indexRef.current))
      }, speed)

      return () => clearInterval(interval)
    }, startDelay)

    return () => clearTimeout(delayTimer)
  }, [text, speed, startDelay])

  return displayed
}

export function useTypewriterLines(
  lines: string[],
  speed = 30,
  lineDelay = 400,
): { visibleLines: string[]; currentLineText: string; done: boolean } {
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (lineIndex >= lines.length) {
      setDone(true)
      return
    }

    const currentLine = lines[lineIndex]

    if (charIndex <= currentLine.length) {
      const timer = setTimeout(() => {
        setCharIndex((c) => c + 1)
      }, speed)
      return () => clearTimeout(timer)
    }

    // Line complete — move to next after delay
    const timer = setTimeout(() => {
      setVisibleLines((prev) => [...prev, currentLine])
      setLineIndex((i) => i + 1)
      setCharIndex(0)
    }, lineDelay)
    return () => clearTimeout(timer)
  }, [lineIndex, charIndex, lines, speed, lineDelay])

  const currentLineText =
    lineIndex < lines.length ? lines[lineIndex].slice(0, charIndex) : ''

  return { visibleLines, currentLineText, done }
}
