import { useState, useCallback, useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useSkin } from '../skin/SkinContext'

const DICE_TYPES = [4, 6, 8, 10, 12, 20]

interface HistoryEntry { sides: number; result: number }

export function DiceDialog() {
  const { Button, Dialog } = useSkin()
  const { activeDialog, closeDialog, addLog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    addLog: s.addLog,
  }))

  const [sides, setSides] = useState(6)
  const [display, setDisplay] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ダイアログを閉じた時にロール中のintervalをキャンセル
  useEffect(() => {
    if (activeDialog !== 'dice' && intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setRolling(false)
    }
  }, [activeDialog])

  const roll = useCallback(() => {
    if (rolling) return
    setRolling(true)
    const final = Math.floor(Math.random() * sides) + 1
    let count = 0
    intervalRef.current = setInterval(() => {
      setDisplay(Math.floor(Math.random() * sides) + 1)
      count++
      if (count >= 14) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setDisplay(final)
        setRolling(false)
        setHistory(h => [{ sides, result: final }, ...h].slice(0, 10))
        addLog(`ダイス d${sides}: ${final}`)
      }
    }, 30)
  }, [rolling, sides, addLog])

  // Enter / Space キーでロール（ダイアログが開いている間のみ）
  useEffect(() => {
    if (activeDialog !== 'dice') return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        roll()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeDialog, roll])

  return (
    <Dialog
      open={activeDialog === 'dice'}
      onClose={closeDialog}
      width="max-w-sm"
    >
      {/* タイトル */}
      <div
        className="font-mono text-[11px] mb-4"
        style={{ color: 'var(--cyan)', textShadow: '0 0 10px rgba(var(--cyan-rgb),0.5)' }}
      >
        DICE ROLLER
      </div>

      {/* ダイス種選択 */}
      <div className="flex gap-1.5 flex-wrap mb-2">
        {DICE_TYPES.map(d => (
          <button
            key={d}
            onClick={() => setSides(d)}
            className="font-mono text-[9px] px-2.5 py-1.5 rounded cursor-pointer transition-all duration-150"
            style={{
              border: `1px solid ${sides === d ? 'var(--purple)' : 'rgba(var(--purple-rgb),0.3)'}`,
              background: sides === d ? '#4c1d95' : 'var(--surface2)',
              color: sides === d ? 'var(--purple-lite)' : '#6672a0',
            }}
          >
            d{d}
          </button>
        ))}
      </div>

      {/* 結果表示 */}
      <div
        className="text-center py-6 rounded-lg my-2"
        style={{
          background: 'var(--surface2)',
          border: '1px solid rgba(var(--purple-rgb),0.2)',
        }}
      >
        <div
          className="flex items-center justify-center font-mono min-h-[80px] transition-colors duration-300"
          style={{
            fontSize: display !== null ? 56 : 32,
            color: rolling ? 'var(--purple)' : 'var(--cyan)',
            textShadow: rolling
              ? '0 0 20px rgba(var(--purple-rgb),0.8)'
              : display !== null ? '0 0 20px rgba(var(--cyan-rgb),0.8)' : 'none',
            transition: rolling ? 'none' : 'color 300ms, text-shadow 300ms',
          }}
        >
          {display !== null ? display : '?'}
        </div>
        <div className="text-muted text-[11px] mt-1">d{sides}</div>
      </div>

      {/* ロールボタン */}
      <button
        onClick={roll}
        disabled={rolling}
        className="w-full font-mono text-[11px] py-3 rounded-lg transition-all duration-150 disabled:cursor-not-allowed"
        style={{
          border: 'none',
          background: rolling ? '#1a1a2e' : '#4c1d95',
          color: rolling ? 'var(--muted)' : 'var(--purple-lite)',
          cursor: rolling ? 'not-allowed' : 'pointer',
          boxShadow: rolling ? 'none' : '0 0 16px rgba(var(--purple-rgb),0.4)',
        }}
        onMouseEnter={e => { if (!rolling) e.currentTarget.style.background = '#5b21b6' }}
        onMouseLeave={e => { if (!rolling) e.currentTarget.style.background = rolling ? '#1a1a2e' : '#4c1d95' }}
      >
        {rolling ? 'ROLLING...' : 'ROLL'}
      </button>

      {/* 履歴 */}
      {history.length > 0 && (
        <div className="mt-4">
          <div className="font-mono text-[10px] text-muted mb-1.5">HISTORY</div>
          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex justify-between px-2 py-0.5 rounded text-[12px]"
                style={{
                  background: i === 0 ? 'rgba(var(--purple-rgb),0.1)' : 'transparent',
                  color: i === 0 ? 'var(--purple-lite)' : 'var(--muted)',
                }}
              >
                <span>d{h.sides}</span>
                <span className="font-mono text-[11px]">{h.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 閉じるボタン */}
      <div className="flex justify-end mt-4">
        <Button variant="ghost" size="sm" onClick={closeDialog}>閉じる</Button>
      </div>
    </Dialog>
  )
}
