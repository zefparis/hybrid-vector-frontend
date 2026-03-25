import { useState, useCallback, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaceCapture } from '@/components/FaceCapture'
import { behavioralCollector, cognitiveCollector, faceCollector } from '@/signal-engine'
import { verifyStudent } from '@/services/edguardApi'
import { useT } from '@/i18n/useLang'
import { config } from '@/config/api'
import styles from '@/hvguard/theme.module.css'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

type VerifyStep = 1 | 2 | 'success' | 'error'

export function EdguardVerify() {
  const navigate = useNavigate()
  const { t } = useT()

  const [step, setStep] = useState<VerifyStep>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selfieB64, setSelfieB64] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tenantId = config.tenantId

  useEffect(() => {
    behavioralCollector.start()

    return () => {
      behavioralCollector.stop()
    }
  }, [])

  const handleIdentitySubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    setStep(2)
  }, [firstName, lastName])

  const handleCapture = useCallback((img: string) => {
    setSelfieB64(img)
    faceCollector.capture(img)
  }, [])

  const handleRetake = useCallback(() => {
    setSelfieB64('')
  }, [])

  const handleProceed = useCallback(async () => {
    if (!selfieB64) {
      setErrorMsg(t('edguard_verify_capture_failed'))
      setStep('error')
      return
    }

    setIsSubmitting(true)
    const startedAt = Date.now()

    try {
      const result = await verifyStudent({
        selfie_b64: selfieB64,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        tenant_id: tenantId,
      })

      const similarityPct = Math.min(100, Math.round(result.similarity ?? 0))
      const durationMs = Date.now() - startedAt
      setConfidence(similarityPct)
      cognitiveCollector.record({ testId: 'verify', score: similarityPct, durationMs })

      if (result.verified) {
        setStep('success')
      } else {
        setErrorMsg(t('edguard_verify_similarity_error').replace('{similarity}', String(similarityPct)))
        setStep('error')
      }
    } catch {
      setErrorMsg(t('edguard_verify_service_unavailable'))
      setStep('error')
    } finally {
      setIsSubmitting(false)
    }
  }, [selfieB64, firstName, lastName, t])

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

  const statusCards = [
    { value: '2 steps', label: 'Identity + capture' },
    { value: 'Live', label: 'Identity match check' },
    { value: step === 'success' ? `${Math.round(confidence)}%` : '--', label: 'Latest similarity' },
    { value: step === 'success' ? 'Granted' : step === 'error' ? 'Review' : 'Pending', label: 'Access decision' },
  ]

  return (
    <div className={styles.app} style={{ background: '#030712' }}>
      <section className={styles.hero} style={{ minHeight: 'auto', paddingBottom: '3rem' }}>
        <div className={`${styles.heroBackdrop} ${styles.gridBg}`} style={{ opacity: 0.72 }} />
        <div className={styles.heroBackdrop} style={{ background: 'radial-gradient(ellipse at 50% 18%, rgba(0,194,255,0.16) 0%, transparent 58%)' }} />
        <div className={styles.heroBackdrop} style={{ backgroundImage: HEX_PATTERN, opacity: 0.5 }} />
        <div className={styles.scanLine} />

        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}
          >
            <div
              className={styles.card}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                background: 'rgba(17,24,39,0.45)',
                borderColor: 'rgba(0,194,255,0.18)',
              }}
            >
              <span className={styles.pulseDot} style={{ background: '#00C2FF', boxShadow: '0 0 12px rgba(0,194,255,0.45)' }} />
              <span style={{ fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: 'rgba(249,250,251,0.9)' }}>
                Identity verification
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '1.25rem' }}>
              <svg width="42" height="42" viewBox="0 0 28 28">
                <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="4" fill="#00C2FF" opacity="0.45" />
              </svg>
              <span className={styles.mono} style={{ color: '#00C2FF', fontWeight: 800, letterSpacing: '0.24em', fontSize: 14 }}>
                EDGUARD VERIFY
              </span>
            </div>

            <h1 className={styles.headline} style={{ fontSize: 'clamp(2.15rem, 8vw, 4.8rem)', marginTop: '1rem' }}>
              Confirm identity
              <br />
              <span style={{ color: 'var(--cyan)' }}>before access.</span>
            </h1>

            <p className={styles.muted} style={{ marginTop: '1rem', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto', fontSize: 'clamp(0.95rem, 2.5vw, 1.06rem)', lineHeight: 1.7 }}>
              Match a live selfie with the enrolled EdGuard profile so verification stays fast, readable, and consistent across mobile and desktop.
            </p>

            <div className={styles.statsGrid}>
              {statusCards.map((item) => (
                <div key={item.label} className={styles.card} style={{ textAlign: 'left', background: 'rgba(17,24,39,0.55)' }}>
                  <div className={styles.mono} style={{ fontSize: 'clamp(1.2rem, 4vw, 1.65rem)', fontWeight: 800, color: 'var(--cyan)' }}>
                    {item.value}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 6, fontSize: '0.8125rem' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="edguardVerifyLayout" style={{ marginTop: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className={styles.card} style={{ background: 'rgba(17,24,39,0.58)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7DDFFF' }}>
                      Active flow
                    </div>
                    <div style={{ marginTop: 6, fontFamily: '"Syne", system-ui, sans-serif', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1, color: '#F9FAFB' }}>
                      {step === 1 ? 'Identity details' : step === 2 ? 'Live identity check' : step === 'success' ? 'Verification complete' : 'Verification issue'}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8899BB' }}>
                    Step {step === 1 ? '1/2' : step === 2 ? '2/2' : 'done'}
                  </span>
                </div>

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
                          {t('edguard_verify_title')}
                        </h2>
                        <p className="text-xs" style={{ color: '#8899BB' }}>
                          {t('edguard_verify_subtitle')}
                        </p>
                      </div>

                      <form onSubmit={handleIdentitySubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{t('edguard_verify_first_name')} *</label>
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              autoFocus
                              placeholder={t('edguard_verify_first_name').toLowerCase()}
                              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                              style={{ backgroundColor: 'rgba(3,7,18,0.78)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F4FF' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>{t('edguard_verify_last_name')} *</label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                              placeholder={t('edguard_verify_last_name').toLowerCase()}
                              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                              style={{ backgroundColor: 'rgba(3,7,18,0.78)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F4FF' }}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          style={{ width: '100%' }}
                        >
                          {t('edguard_verify_continue')}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="verify-face" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                      <div className="text-center mb-4">
                        <h2 className="text-base font-bold tracking-wider mb-1" style={{ color: '#F0F4FF' }}>
                          {t('edguard_verify_center_face')}
                        </h2>
                        <p className="text-xs" style={{ color: '#8899BB' }}>
                          {t('edguard_verify_center_face_desc')}
                        </p>
                      </div>

                      <FaceCapture
                        capturedImage={selfieB64}
                        onCapture={handleCapture}
                        onRetake={handleRetake}
                        onProceed={handleProceed}
                        proceedLabel={t('edguard_verify_connect')}
                      />

                      <button
                        onClick={handleReset}
                        className={`${styles.btn} ${styles.btnOutline}`}
                        style={{ width: '100%', marginTop: '0.75rem' }}
                      >
                        {t('edguard_verify_change_identity')}
                      </button>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="verify-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 py-6"
                    >
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
                          {t('edguard_verify_identity_confirmed')}
                        </p>
                        <p className="text-xs mb-3" style={{ color: '#8899BB' }}>
                          {`${firstName} ${lastName}`.trim()}
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                          <span className="text-[10px] font-bold tracking-widest" style={{ color: '#00FF88' }}>
                            {t('edguard_verify_similarity')}
                          </span>
                          <span className="text-sm font-black" style={{ color: '#00FF88', fontFamily: 'monospace' }}>
                            {Math.round(confidence)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs" style={{ color: '#3D5A75' }}>
                        {t('edguard_verify_redirecting')}
                      </p>
                      <button
                        onClick={handleSuccessContinue}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ width: '100%' }}
                      >
                        {t('edguard_verify_access_session')}
                      </button>
                    </motion.div>
                  )}

                  {step === 'error' && (
                    <motion.div
                      key="verify-error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4 py-6"
                    >
                      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,51,85,0.1)', border: '2px solid #FF3355' }}>
                        <span className="text-3xl" style={{ color: '#FF3355' }}>✗</span>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-bold tracking-widest mb-2" style={{ color: '#FF3355' }}>
                          {t('edguard_verify_failed')}
                        </p>
                        <p className="text-xs max-w-xs" style={{ color: '#8899BB' }}>
                          {errorMsg}
                        </p>
                      </div>

                      <div className="grid gap-3 w-full sm:grid-cols-2">
                        <button
                          onClick={handleRetry}
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          style={{ width: '100%' }}
                        >
                          {t('edguard_verify_retry')}
                        </button>
                        <button
                          onClick={handleReset}
                          className={`${styles.btn} ${styles.btnOutline}`}
                          style={{ width: '100%' }}
                        >
                          {t('edguard_verify_change_identity')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl" style={{ backgroundColor: 'rgba(10,15,30,0.85)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[#1E2D45] border-t-[#00C2FF] animate-spin" />
                      <span className="text-xs font-semibold tracking-widest" style={{ color: '#00C2FF' }}>{t('edguard_verify_progress')}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                {
                  title: 'Fast gate',
                  body: 'The verify flow checks identity quickly before the learner enters the monitored session.',
                },
                {
                  title: 'Consistent capture',
                  body: 'The same capture experience is reused across enrollment and verification for better mobile UX.',
                },
                {
                  title: 'Readable outcome',
                  body: 'Similarity, success state, and next action stay visible without cluttering the screen.',
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + idx * 0.08, duration: 0.45 }}
                  className={styles.card}
                  style={{ background: 'rgba(17,24,39,0.45)' }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7DDFFF' }}>
                    {item.title}
                  </div>
                  <div className={styles.muted} style={{ marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {item.body}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .edguardVerifyLayout {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.9fr);
            gap: 1rem;
            align-items: start;
          }

          @media (max-width: 960px) {
            .edguardVerifyLayout {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    </div>
  )
}