import { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export type GuardConfig = {
  id: string
  name: string
  description: string
  path: string
}

type GuardLauncherProps = {
  guard: GuardConfig | null
  onClose: () => void
}

export function GuardLauncher({ guard, onClose }: GuardLauncherProps) {
  const { canInstall, install, isIOS } = usePWAInstall()

  const handleOpen = useCallback(() => {
    if (!guard) {
      return
    }

    window.location.href = guard.path
    onClose()
  }, [guard, onClose])

  const handleInstall = useCallback(async () => {
    await install()
  }, [install])

  if (guard === null) {
    return null
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0d0d0d',
          border: '1px solid rgba(0,194,255,0.4)',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '340px',
          width: '100%',
          margin: '0 16px',
          color: 'white',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h3 className="text-xl font-bold tracking-wide text-white">{guard.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{guard.description}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleOpen}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              background: '#00C2FF',
              color: '#000',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
          >
            Ouvrir
          </button>

          {canInstall && (
            <button
              type="button"
              onClick={handleInstall}
              className="w-full rounded-xl border border-cyan-500/50 bg-slate-950 px-4 py-3 text-sm font-bold tracking-wider text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Installer
            </button>
          )}

          {isIOS && !canInstall && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-300">
              Pour installer : appuyez sur Partager puis 'Ajouter à l'écran d'accueil'
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#999',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
