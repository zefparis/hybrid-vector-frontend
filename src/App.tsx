import { Routes, Route } from 'react-router-dom'
import { HVGuardLanding } from './hvguard/HVGuardLanding'
import { Dashboard } from '@/pages/Dashboard'
import { EdguardHome } from '@/pages/EdguardHome'
import { EdguardEnroll } from '@/pages/EdguardEnroll'
import { EdguardSession } from '@/pages/EdguardSession'
import { EdguardVerify } from '@/pages/Edguardverify'
import { EdguardProfile } from './pages/EdguardProfile'

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HVGuardLanding />} />
        <Route path="/edguard" element={<EdguardHome />} />
        <Route path="/edguard/enroll" element={<EdguardEnroll />} />
        <Route path="/edguard/session" element={<EdguardSession />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edguard/verify" element={<EdguardVerify />} />
        <Route path="/edguard/profile" element={<EdguardProfile />} />
      </Routes>
    </div>
  )
}
