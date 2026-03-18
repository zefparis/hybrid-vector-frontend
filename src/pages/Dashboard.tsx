import { motion } from 'framer-motion'
import { Download, BarChart3, Users, ShieldCheck, Clock, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { StatusBadge } from '@/components/StatusBadge'
import type { SessionResult } from '@/types'

function exportToCSV(sessions: SessionResult[]) {
  const headers = ['timestamp', 'session_id', 'user_id', 'trust_score', 'is_human', 'confidence_level', 'facial_liveness', 'facial_confidence', 'cognitive_score', 'processing_time_ms']
  const rows = sessions.map((s) => [
    s.timestamp,
    s.session_id,
    s.user_id,
    String(s.trust_score),
    String(s.is_human),
    s.confidence_level,
    String(s.facial_liveness),
    String(s.facial_confidence),
    String(s.cognitive_score),
    String(s.processing_time_ms),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hybrid-vector-sessions-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ts
  }
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 75 ? '#00C2FF' : value >= 40 ? '#F97316' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-16 rounded-full bg-white/5 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export function Dashboard() {
  const { sessionHistory, reset } = useSessionStore()

  const totalSessions = sessionHistory.length
  const humanSessions = sessionHistory.filter((s) => s.is_human).length
  const avgScore =
    totalSessions > 0
      ? Math.round(sessionHistory.reduce((sum, s) => sum + s.trust_score, 0) / totalSessions)
      : 0
  const avgProcessing =
    totalSessions > 0
      ? Math.round(sessionHistory.reduce((sum, s) => sum + s.processing_time_ms, 0) / totalSessions)
      : 0
  const humanRate = totalSessions > 0 ? Math.round((humanSessions / totalSessions) * 100) : 0

  const stats = [
    {
      label: 'Total Sessions',
      value: String(totalSessions),
      icon: BarChart3,
      color: '#00C2FF',
      sub: 'All time',
    },
    {
      label: 'Human Rate',
      value: `${humanRate}%`,
      icon: Users,
      color: '#22C55E',
      sub: `${humanSessions} verified`,
    },
    {
      label: 'Avg Trust Score',
      value: String(avgScore),
      icon: ShieldCheck,
      color: avgScore >= 75 ? '#00C2FF' : avgScore >= 40 ? '#F97316' : '#EF4444',
      sub: 'out of 100',
    },
    {
      label: 'Avg Processing',
      value: `${avgProcessing}ms`,
      icon: Clock,
      color: '#a78bfa',
      sub: 'end-to-end',
    },
  ]

  return (
    <div className="min-h-screen bg-hv-bg pt-24 pb-16 px-4">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />
      <div className="max-w-6xl mx-auto relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-black text-3xl text-hv-text">Session Dashboard</h1>
            <p className="text-hv-muted text-sm mt-1">
              {totalSessions > 0
                ? `${totalSessions} session${totalSessions !== 1 ? 's' : ''} recorded this session`
                : 'No sessions yet — run a demo to see results here'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalSessions > 0 && (
              <>
                <button
                  onClick={() => exportToCSV(sessionHistory)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-hv-cyan/30 text-hv-cyan hover:bg-hv-cyan/10 transition-all duration-200"
                >
                  <Download size={15} />
                  Export CSV
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-white/10 text-hv-muted hover:text-hv-red hover:border-hv-red/30 transition-all duration-200"
                >
                  <Trash2 size={15} />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="glass rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <div className="font-black text-2xl" style={{ color }}>
                {value}
              </div>
              <div className="text-hv-text text-xs font-semibold mt-0.5">{label}</div>
              <div className="text-hv-muted text-xs mt-0.5">{sub}</div>
            </motion.div>
          ))}
        </div>

        {totalSessions === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl border border-white/5 p-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-hv-cyan/10 border border-hv-cyan/20 flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={28} className="text-hv-cyan" />
            </div>
            <h3 className="font-bold text-hv-text text-lg mb-2">No Sessions Yet</h3>
            <p className="text-hv-muted text-sm max-w-sm mx-auto mb-6">
              Complete a verification on the Demo page to see your session analytics here.
            </p>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-hv-cyan text-hv-bg hover:bg-hv-cyan-dark transition-all duration-200"
              style={{ boxShadow: '0 0 16px rgba(0,194,255,0.35)' }}
            >
              Go to Demo
            </a>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-hv-text text-sm tracking-wider uppercase">
                Session History
              </h2>
              <span className="text-xs text-hv-muted">{totalSessions} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Timestamp', 'Session ID', 'Trust Score', 'Status', 'Confidence', 'Facial Live.', 'Cognitive', 'Time'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold text-hv-muted tracking-wider uppercase whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((session, index) => (
                    <motion.tr
                      key={session.session_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-hv-muted text-xs whitespace-nowrap font-mono">
                        {formatTimestamp(session.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-hv-muted text-xs font-mono whitespace-nowrap">
                        {session.session_id.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar value={session.trust_score} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={session.is_human ? 'HUMAN' : 'BOT'} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-md"
                          style={{
                            color:
                              session.confidence_level === 'HIGH'
                                ? '#00C2FF'
                                : session.confidence_level === 'MEDIUM'
                                  ? '#F97316'
                                  : '#EF4444',
                            backgroundColor:
                              session.confidence_level === 'HIGH'
                                ? 'rgba(0,194,255,0.1)'
                                : session.confidence_level === 'MEDIUM'
                                  ? 'rgba(249,115,22,0.1)'
                                  : 'rgba(239,68,68,0.1)',
                          }}
                        >
                          {session.confidence_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar value={session.facial_liveness} />
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar value={session.cognitive_score} />
                      </td>
                      <td className="px-4 py-3 text-hv-muted text-xs font-mono whitespace-nowrap">
                        {session.processing_time_ms}ms
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
