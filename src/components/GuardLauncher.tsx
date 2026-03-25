import { useCallback } from 'react'
import { createPortal } from 'react-dom'

export type GuardConfig = {
  id: string
  name: string
  description: string
  url: string
}

type GuardLauncherProps = {
  guard: GuardConfig | null
  onClose: () => void
}

export function GuardLauncher({ guard, onClose }: GuardLauncherProps) {
  const handleOpen = useCallback(() => {
    if (!guard) {
      return
    }

    window.location.href = guard.url
    onClose()
  }, [guard, onClose])

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
          <div
            className="mt-4 rounded-xl border px-4 py-3 text-sm leading-6"
            style={{
              borderColor: 'rgba(0,194,255,0.18)',
              background: 'rgba(0,194,255,0.06)',
              color: '#cbd5e1',
            }}
          >
            Open the module on its own secure domain to continue. If you want to install it, use the browser install prompt from that module after it opens.
          </div>
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
            Open module
          </button>

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
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
