import { useCallback, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePWAInstall() {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(userAgent)
    setIsIOS(ios)

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent
      installEvent.preventDefault()
      promptRef.current = installEvent
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const install = useCallback(async () => {
    const promptEvent = promptRef.current

    if (!promptEvent) {
      return
    }

    await promptEvent.prompt()
    await promptEvent.userChoice
    promptRef.current = null
    setCanInstall(false)
  }, [])

  return {
    canInstall,
    install,
    isIOS,
  }
}
