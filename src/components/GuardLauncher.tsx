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
        backgroundColor: 'rgba(0,0,0,0.7)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111',
          border: '1px solid #00C2FF',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '360px',
          width: '100%',
          margin: '0 16px',
          color: 'white',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-wide text-white">{guard.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{guard.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Fermer
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleOpen}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold tracking-wider text-slate-950 transition hover:bg-cyan-300"
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
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold tracking-wider text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
