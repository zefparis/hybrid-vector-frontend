import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaceCapture } from '@/components/FaceCapture'
import { useEdguardStore } from '@/store/edguardStore'
import { verifyStudent } from '@/services/edguardApi'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300C2FF' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

type VerifyStep = 'id' | 'face' | 'checking' | 'success' | 'error'

export function EdguardVerify() {
  const navigate = useNavigate()
  const { setStudentInfo } = useEdguardStore()

  const [step, setStep] = useState<VerifyStep>('id')
  const [studentId, setStudentId] = useState('')
  const [selfieB64, setSelfieB64] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  // Step 1 — submit student ID
  const handleIdSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim()) return
    setStep('face')
  }, [studentId])

  // Step 2 — face captured → verify
  const handleCapture = useCallback(async (img: string) => {
    setSelfieB64(img)
  }, [])

  const handleLivenessComplete = useCallback(async (frames: string[]) => {
    // Use last captured frame as selfie for verification
    const selfie = selfieB64 || frames[frames.length - 1] || ''
    if (!selfie) {
      setErrorMsg('EMBEDDING_FAILED')
      setStep('error')
      return
    }
    setStep('checking')

    try {
      const result = await verifyStudent({
        student_id: studentId.trim(),
        selfie_b64: selfie,
      })

      if (result.success && result.match) {
        setConfidence(result.similarity ?? 0)
        setStudentInfo(studentId.trim(), result.institution_id ?? '')
        setStep('success')
        // Auto-redirect to session after 2s
        setTimeout(() => navigate('/edguard/session'), 2000)
      } else {
        setErrorMsg(result.error ?? 'IDENTITY_MISMATCH')
        setStep('error')
      }
    } catch {
      setErrorMsg('NETWORK_ERROR')
      setStep('error')
    }
  }, [studentId, selfieB64, setStudentInfo, navigate])

  const handleRetry = useCallback(() => {
    setSelfieB64('')
    setErrorMsg('')
    setStep('face')
  }, [])

  const handleReset = useCallback(() => {
    setStudentId('')
    setSelfieB64('')
    setErrorMsg('')
    setStep('id')
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0A0F1E' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HEX_PATTERN }} />

      <div className="w-full max-w-md relative">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00C2FF" strokeWidth="2" />
            </svg>
            <span className="text-sm font-black tracking-widest" style={{ color: '#F0F4FF' }}>
              EDGUARD
            </span>
          </div>
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#8899BB' }}>
            ACADEMIC IDENTITY SHIELD
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 relative overflow-hidden"
          style={{ backgroundColor: '#0D1526', border: '1px solid #1E2D45' }}
        >
          <AnimatePresence mode="wait">

            {/* STEP 1 — Student ID */}
            {step === 'id' && (
              <motion.div
                key="id"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'rgba(0,194,255,0.1)', border: '1.5px solid rgba(0,194,255,0.3)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold tracking-wider mb-1" style={{ color: '#F0F4FF' }}>
                    Identify Yourself
                  </h2>
                  <p className="text-xs" style={{ color: '#8899BB' }}>
                    Your face is your password
                  </p>
                </div>

                <form onSubmit={handleIdSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold tracking-widest" style={{ color: '#8899BB' }}>
                      STUDENT ID
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      autoFocus
                      placeholder="ex: STU-2024-001"
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                      style={{
                        backgroundColor: '#0A0F1E',
                        border: '1px solid #1E2D45',
                        color: '#F0F4FF',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300"
                    style={{
                      backgroundColor: '#00C2FF',
                      color: '#0A0F1E',
                      boxShadow: '0 0 20px rgba(0,194,255,0.3)',
                    }}
                  >
                    Verify Identity →
                  </button>
                </form>

                <p className="text-center text-[10px] mt-4" style={{ color: '#3D5A75' }}>
                  No password required — biometric verification only
                </p>
              </motion.div>
            )}

            {/* STEP 2 — Face capture */}
            {step === 'face' && (
              <motion.div
                key="face"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-4">
                  <h2 className="text-base font-bold tracking-wider mb-1" style={{ color: '#F0F4FF' }}>
                    Look at the Camera
                  </h2>
                  <p className="text-xs" style={{ color: '#8899BB' }}>
                    Align your face with your enrollment photo
                  </p>
                </div>

                <FaceCapture
                  capturedImage={selfieB64}
                  onCapture={handleCapture}
                  onRetake={() => setSelfieB64('')}
                  onProceed={() => {}}
                  onLivenessComplete={handleLivenessComplete}
                />

                <button
                  onClick={handleReset}
                  className="w-full mt-3 text-[10px] font-semibold tracking-wider py-2"
                  style={{ color: '#3D5A75' }}
                >
                  ← Change student ID
                </button>
              </motion.div>
            )}

            {/* STEP 3 — Checking */}
            {step === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5 py-8"
              >
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full"
                    style={{
                      border: '2px solid rgba(0,194,255,0.2)',
                      borderTop: '2px solid #00C2FF',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold tracking-widest mb-1" style={{ color: '#00C2FF' }}>
                    VERIFYING IDENTITY
                  </p>
                  <p className="text-xs" style={{ color: '#8899BB' }}>
                    Comparing biometric signature...
                  </p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </motion.div>
            )}

            {/* STEP 4 — Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(0,255,136,0.15)',
                    border: '2px solid #00FF88',
                    boxShadow: '0 0 30px rgba(0,255,136,0.3)',
                  }}
                >
                  <span className="text-3xl" style={{ color: '#00FF88' }}>✓</span>
                </motion.div>

                <div className="text-center">
                  <p className="text-sm font-bold tracking-widest mb-1" style={{ color: '#00FF88' }}>
                    IDENTITY CONFIRMED
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#8899BB' }}>
                    {studentId}
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{ backgroundColor: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
                  >
                    <span className="text-[10px] font-bold tracking-widest" style={{ color: '#00FF88' }}>
                      SIMILARITY
                    </span>
                    <span className="text-sm font-black" style={{ color: '#00FF88', fontFamily: 'monospace' }}>
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-xs" style={{ color: '#3D5A75' }}>
                  Redirecting to session...
                </p>
              </motion.div>
            )}

            {/* STEP 5 — Error */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,51,85,0.1)', border: '2px solid #FF3355' }}
                >
                  <span className="text-3xl" style={{ color: '#FF3355' }}>✗</span>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold tracking-widest mb-2" style={{ color: '#FF3355' }}>
                    VERIFICATION FAILED
                  </p>
                  <p className="text-xs max-w-xs" style={{ color: '#8899BB' }}>
                    {errorMsg === 'IDENTITY_MISMATCH'
                      ? 'Your face does not match the enrolled identity. Please try again.'
                      : errorMsg === 'NOT_ENROLLED'
                      ? 'No biometric profile found for this student ID. Please enroll first.'
                      : 'Service unavailable. Please try again.'}
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wider"
                    style={{
                      backgroundColor: '#00C2FF',
                      color: '#0A0F1E',
                      boxShadow: '0 0 20px rgba(0,194,255,0.3)',
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wider"
                    style={{ border: '1px solid #1E2D45', color: '#8899BB' }}
                  >
                    Change ID
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] mt-4 font-semibold tracking-widest" style={{ color: '#1E2D45' }}>
          POWERED BY HYBRID VECTOR · ML-KEM FIPS 203/204
        </p>
      </div>
    </div>
  )
}