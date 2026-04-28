import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'

export function DeckDropDialog() {
  const { deckDropInfo, setDeckDropInfo, addLog } = useUIStore(s => ({
    deckDropInfo: s.deckDropInfo,
    setDeckDropInfo: s.setDeckDropInfo,
    addLog: s.addLog,
  }))
  const moveCard = useGameStore(s => s.moveCard)

  if (!deckDropInfo) return null

  function handleChoose(top: boolean) {
    if (!deckDropInfo) return
    moveCard(deckDropInfo.fromZoneId, deckDropInfo.instanceId, 'deck', top ? 0 : undefined)
    addLog(`カード移動 → 山札（${top ? '上' : '下'}）`)
    setDeckDropInfo(null)
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  }
  const dialog: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid rgba(var(--purple-rgb),0.4)',
    borderRadius: 12,
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
    fontFamily: "'Chakra Petch', sans-serif",
  }
  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 10,
    padding: '10px 24px',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid rgba(var(--purple-rgb),0.4)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    transition: 'all 150ms',
    minWidth: 120,
  }

  return (
    <div style={overlay} onClick={() => setDeckDropInfo(null)}>
      <div style={dialog} onClick={e => e.stopPropagation()}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10,
          color: 'var(--cyan)',
          textShadow: '0 0 10px rgba(var(--cyan-rgb),0.5)',
        }}>
          山札に追加
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          どこに追加しますか？
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={btn}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#1a1a3a'
              e.currentTarget.style.borderColor = 'var(--purple)'
              e.currentTarget.style.color = 'var(--purple-lite)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface2)'
              e.currentTarget.style.borderColor = 'rgba(var(--purple-rgb),0.4)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onClick={() => handleChoose(true)}
          >
            一番上
          </button>
          <button
            style={btn}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#1a1a3a'
              e.currentTarget.style.borderColor = 'var(--purple)'
              e.currentTarget.style.color = 'var(--purple-lite)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface2)'
              e.currentTarget.style.borderColor = 'rgba(var(--purple-rgb),0.4)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onClick={() => handleChoose(false)}
          >
            一番下
          </button>
        </div>
      </div>
    </div>
  )
}
