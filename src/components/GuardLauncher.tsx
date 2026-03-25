import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { canInstall, install, isIOS } = usePWAInstall()

  const handleOpen = useCallback(() => {
    if (!guard) {
      return
    }

    if (typeof navigate === 'function') {
      navigate(guard.path)
    } else {
      window.location.assign(guard.path)
    }

    onClose()
  }, [guard, navigate, onClose])

  const handleInstall = useCallback(async () => {
    await install()
  }, [install])

  if (guard === null) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
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
    </div>
  )
}
