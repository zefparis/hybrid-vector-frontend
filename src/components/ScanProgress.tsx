import { motion } from 'framer-motion'
import type { ScanPhase } from '@/types'

const nodes: { id: ScanPhase; label: string }[] = [
  { id: 'facial', label: 'FACIAL' },
  { id: 'vocal', label: 'VOCAL' },
  { id: 'reflex', label: 'REFLEX' },
  { id: 'analysis', label: 'ANALYSIS' },
]

const phaseOrder: ScanPhase[] = ['facial', 'vocal', 'reflex', 'analysis', 'result']

function getNodeState(node: ScanPhase, current: ScanPhase): 'pending' | 'active' | 'complete' {
  const ci = phaseOrder.indexOf(current)
  const ni = phaseOrder.indexOf(node)
  if (ni < ci) return 'complete'
  if (ni === ci) return 'active'
  return 'pending'
}

interface ScanProgressProps {
  phase: ScanPhase
}

export function ScanProgress({ phase }: ScanProgressProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto px-2 select-none">
      {nodes.map((node, i) => {
        const state = phase === 'result' ? 'complete' : getNodeState(node.id, phase)
        return (
          <div key={node.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className="relative">
                {state === 'active' && (
                  <motion.div
                    className="absolute -inset-2 rounded-full"
                    style={{ border: '1.5px solid rgba(0,194,255,0.4)' }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-500"
                  style={{
                    backgroundColor:
                      state === 'complete' ? '#00FF88'
                        : state === 'active' ? '#00C2FF'
                          : 'transparent',
                    border:
                      state === 'complete' ? '2px solid #00FF88'
                        : state === 'active' ? '2px solid #00C2FF'
                          : '2px solid #1E2D45',
                    color:
                      state === 'complete' ? '#0A0F1E'
                        : state === 'active' ? '#0A0F1E'
                          : '#8899BB',
                    boxShadow:
                      state === 'active' ? '0 0 12px rgba(0,194,255,0.5)'
                        : state === 'complete' ? '0 0 10px rgba(0,255,136,0.4)'
                          : 'none',
                  }}
                >
                  {state === 'complete' ? '✓' : ''}
                </div>
              </div>
              <span
                className="text-[10px] font-semibold tracking-widest whitespace-nowrap transition-colors duration-300"
                style={{
                  color:
                    state === 'active' ? '#00C2FF'
                      : state === 'complete' ? '#00FF88'
                        : '#8899BB',
                }}
              >
                {node.label}
              </span>
            </div>

            {i < nodes.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-5 relative overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, ${
                      getNodeState(nodes[i + 1].id, phase === 'result' ? 'result' : phase) !== 'pending'
                        ? '#00FF88'
                        : '#1E2D45'
                    } 0px, ${
                      getNodeState(nodes[i + 1].id, phase === 'result' ? 'result' : phase) !== 'pending'
                        ? '#00FF88'
                        : '#1E2D45'
                    } 4px, transparent 4px, transparent 8px)`,
                  }}
                />
                {state === 'active' && (
                  <motion.div
                    className="absolute inset-y-0 left-0 w-3"
                    style={{ background: 'linear-gradient(90deg, #00C2FF, transparent)' }}
                    animate={{ left: ['0%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
