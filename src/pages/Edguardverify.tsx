import { useState, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaceCapture } from '@/components/FaceCapture'
import { verifyStudent } from '@/services/edguardApi'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

type VerifyStep = 1 | 2 | 'success' | 'error'

export function EdguardVerify() {
  const navigate = useNavigate()

  const [step, setStep] = useState<VerifyStep>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selfieB64, setSelfieB64] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tenantId = 'demo-tenant'

  const handleIdentitySubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    setStep(2)
  }, [firstName, lastName])

  const handleCapture = useCallback((img: string) => {
    setSelfieB64(img)
  }, [])

  const handleRetake = useCallback(() => {
    setSelfieB64('')
  }, [])

  const handleProceed = useCallback(async () => {
    if (!selfieB64) {
      setErrorMsg('Capture failed — please center your face and try again.')
      setStep('error')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await verifyStudent({
        selfie_b64: selfieB64,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        tenant_id: tenantId,
      })

      const similarityPct = Math.min(100, Math.round(result.similarity ?? 0))
      setConfidence(similarityPct)

      if (result.verified) {
        setStep('success')
      } else {
        setErrorMsg(`Similarité: ${similarityPct}% — Seuil requis: 80%`)
        setStep('error')
      }
    } catch {
      setErrorMsg('Service indisponible. Réessayez.')
      setStep('error')
    } finally {
      setIsSubmitting(false)
    }
  }, [selfieB64, firstName, lastName])

  const handleRetry = useCallback(() => {
    setSelfieB64('')
    setErrorMsg('')
    setStep(2)
  }, [])

  const handleReset = useCallback(() => {
    setFirstName('')
    setLastName('')
    setSelfieB64('')
    setConfidence(0)
    setErrorMsg('')
    setStep(1)
  }, [])

  const handleSuccessContinue = useCallback(() => {
    navigate('/edguard/session')
  }, [navigate])

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 sm:px-4 overflow-x-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="max-w-md mx-auto relative w-full pt-8 sm:pt-12">
        <div className="rounded-2xl p-5 sm:p-7 relative overflow-hidden" style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="verify-id" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(0,194,255,0.1)', border: '1.5px solid rgba(0,194,255,0.3)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold tracking-wider mb-1" style={{ color: '#F0F4FF' }}>
                    Vérification d’identité
                  </h2>
                  <p className="text-xs" style={{ color: '#8899BB' }}>
                    Renseignez votre prénom et votre nom pour continuer
                  </p>
                </div>

                <form onSubmit={handleIdentitySubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>PRÉNOM *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoFocus
                        placeholder="Jean"
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                        style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45', color: '#F0F4FF' }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>NOM *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        placeholder="Dupont"
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                        style={{ backgroundColor: '#0A0F1E', border: '1px solid #1E2D45', color: '#F0F4FF' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
                    style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
                  >
                    Continuer →
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="verify-face" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-4">
                  <h2 className="text-base font-bold tracking-wider mb-1" style={{ color: '#F0F4FF' }}>
                    Centrez votre visage
                  </h2>
                  <p className="text-xs" style={{ color: '#8899BB' }}>
                    Capturez un selfie net pour vérifier votre identité
                  </p>
                </div>

                <FaceCapture
                  capturedImage={selfieB64}
                  onCapture={handleCapture}
                  onRetake={handleRetake}
                  onProceed={handleProceed}
                  proceedLabel="Me connecter"
                />

                <button
                  onClick={handleReset}
                  className="w-full mt-3 text-[10px] font-semibold tracking-wider py-2"
                  style={{ color: '#3D5A75' }}
                >
                  ← Changer d’identité
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="verify-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, delay: 0.05 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,255,136,0.15)', border: '2px solid #00FF88', boxShadow: '0 0 30px rgba(0,255,136,0.3)' }}
                >
                  <span className="text-3xl" style={{ color: '#00FF88' }}>✓</span>
                </motion.div>

                <div className="text-center">
                  <p className="text-sm font-bold tracking-widest mb-1" style={{ color: '#00FF88' }}>
                    IDENTITÉ CONFIRMÉE
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#8899BB' }}>
                    {`${firstName} ${lastName}`.trim()}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                    <span className="text-[10px] font-bold tracking-widest" style={{ color: '#00FF88' }}>
                      SIMILARITÉ
                    </span>
                    <span className="text-sm font-black" style={{ color: '#00FF88', fontFamily: 'monospace' }}>
                      {Math.round(confidence)}%
                    </span>
                  </div>
                </div>

                <p className="text-xs" style={{ color: '#3D5A75' }}>
                  Redirection vers la session...
                </p>
                <button
                  onClick={handleSuccessContinue}
                  className="mt-2 px-4 py-2 rounded-xl font-bold text-xs tracking-wider"
                  style={{ backgroundColor: '#00C2FF', color: '#0A0F1E' }}
                >
                  Accéder à la session →
                </button>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div key="verify-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,51,85,0.1)', border: '2px solid #FF3355' }}>
                  <span className="text-3xl" style={{ color: '#FF3355' }}>✗</span>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold tracking-widest mb-2" style={{ color: '#FF3355' }}>
                    VÉRIFICATION ÉCHOUÉE
                  </p>
                  <p className="text-xs max-w-xs" style={{ color: '#8899BB' }}>
                    {errorMsg}
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wider"
                    style={{ backgroundColor: '#00C2FF', color: '#0A0F1E', boxShadow: '0 0 20px rgba(0,194,255,0.3)' }}
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wider"
                    style={{ border: '1px solid #1E2D45', color: '#8899BB' }}
                  >
                    Changer d’identité
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl" style={{ backgroundColor: 'rgba(10,15,30,0.85)' }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#1E2D45] border-t-[#00C2FF] animate-spin" />
                <span className="text-xs font-semibold tracking-widest" style={{ color: '#00C2FF' }}>VÉRIFICATION EN COURS...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}