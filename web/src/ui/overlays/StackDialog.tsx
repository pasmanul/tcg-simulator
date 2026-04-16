import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import type { GameCard } from '../../domain/types'

export function StackDialog() {
  const { stackInfo, closeStackDialog, addLog } = useUIStore(s => ({
    stackInfo: s.stackInfo,
    closeStackDialog: s.closeStackDialog,
    addLog: s.addLog,
  }))
  const { zones, unstackCard } = useGameStore(s => ({
    zones: s.zones,
    unstackCard: s.unstackCard,
  }))

  if (!stackInfo) return null

  // 最新状態のカードをストアから取得（ダイアログ表示後に変化している可能性があるため）
  const topCard = zones[stackInfo.zoneId]?.cards.find(
    c => c.instanceId === stackInfo.gc.instanceId,
  ) ?? stackInfo.gc

  const allCards: GameCard[] = [topCard, ...topCard.under_cards]

  function handleDetach(gc: GameCard, index: number) {
    if (index === 0) return // トップカードは切り離さない
    unstackCard(stackInfo!.zoneId, topCard.instanceId, gc.instanceId)
    addLog(`${gc.card.name} をスタックから切り離し`)
    closeStackDialog()
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  }
  const dialog: React.CSSProperties = {
    background: '#080c1c',
    border: '1px solid rgba(124,58,237,0.4)',
    borderRadius: 12,
    padding: 24,
    width: 400,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
    fontFamily: "'Chakra Petch', sans-serif",
  }
  const cardRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(124,58,237,0.15)',
    background: '#0e1228',
  }
  const detachBtn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: '4px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    border: '1px solid rgba(239,68,68,0.5)',
    background: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    transition: 'all 150ms',
    marginLeft: 'auto',
  }

  return (
    <div style={overlay} onClick={closeStackDialog}>
      <div style={dialog} onClick={e => e.stopPropagation()}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 11,
          color: '#e07020',
          textShadow: '0 0 10px rgba(224,112,32,0.5)',
        }}>
          STACK ({allCards.length})
        </div>

        <div style={{ color: '#505c78', fontSize: 11 }}>
          上から順に表示。「切り離す」でゾーンに戻します。
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {allCards.map((gc, i) => (
            <div key={gc.instanceId} style={cardRow}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                background: i === 0 ? '#e07020' : '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#fff', fontFamily: 'monospace',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#aabbd0', fontSize: 13 }}>{gc.card.name}</div>
                <div style={{ color: '#505c78', fontSize: 11 }}>
                  {gc.card.civilizations.join('/')} • {gc.card.card_type}
                </div>
              </div>
              {i > 0 && (
                <button
                  style={detachBtn}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onClick={() => handleDetach(gc, i)}
                >
                  切り離す
                </button>
              )}
              {i === 0 && (
                <span style={{ fontSize: 10, color: '#e07020', marginLeft: 'auto' }}>TOP</span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={closeStackDialog}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#505c78',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: "'Chakra Petch', sans-serif",
            alignSelf: 'flex-end',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
