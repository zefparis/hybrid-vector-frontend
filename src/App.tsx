import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Landing } from '@/pages/Landing'
import { Demo } from '@/pages/Demo'
import { Dashboard } from '@/pages/Dashboard'
import { EdguardHome } from '@/pages/EdguardHome'
import { EdguardEnroll } from '@/pages/EdguardEnroll'
import { EdguardSession } from '@/pages/EdguardSession'
import { EdguardVerify } from '@/pages/Edguardverify'

export default function App() {
  return (
    <div className="min-h-screen bg-hv-bg">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/edguard" element={<EdguardHome />} />
        <Route path="/edguard/enroll" element={<EdguardEnroll />} />
        <Route path="/edguard/session" element={<EdguardSession />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edguard/verify" element={<EdguardVerify />} />
      </Routes>
    </div>
  )
}
