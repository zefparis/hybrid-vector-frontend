import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { HVGuardLanding } from './hvguard/HVGuardLanding'
import { Dashboard } from '@/pages/Dashboard'
import { EdguardHome } from '@/pages/EdguardHome'
import { EdguardEnroll } from '@/pages/EdguardEnroll'
import { EdguardSession } from '@/pages/EdguardSession'
import { EdguardVerify } from '@/pages/Edguardverify'
import { EdguardProfile } from './pages/EdguardProfile'

export default function App() {
  useEffect(() => {
    const existingScript = document.querySelector('script[data-widget="15965865-8f52-4d4a-9d0d-b6d151107749"]')

    if (existingScript) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://hcs-widget-mvp.vercel.app/widget/v3/hcs-widget.js'
    script.async = true
    script.setAttribute('data-widget', '15965865-8f52-4d4a-9d0d-b6d151107749')

    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return (
    <div>
      <Routes>
        <Route path="/" element={<HVGuardLanding />} />
        <Route path="/edguard" element={<EdguardHome />} />
        <Route path="/edguard/enroll" element={<EdguardEnroll />} />
        <Route path="/enroll" element={<EdguardEnroll />} />
        <Route path="/edguard/session" element={<EdguardSession />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edguard/verify" element={<EdguardVerify />} />
        <Route path="/edguard/profile" element={<EdguardProfile />} />
      </Routes>
    </div>
  )
}
