import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Landing } from '@/pages/Landing'
import { Demo } from '@/pages/Demo'
import { Dashboard } from '@/pages/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-hv-bg">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}
