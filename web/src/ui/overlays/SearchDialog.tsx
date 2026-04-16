import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'

const MOVE_TARGETS = [
  { id: 'hand', label: '手札' },
  { id: 'mana', label: 'マナゾーン' },
  { id: 'graveyard', label: '墓地' },
  { id: 'temp', label: '保留' },
]

export function SearchDialog() {
  const { activeDialog, closeDialog, addLog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    addLog: s.addLog,
  }))
  const zones = useGameStore(s => s.zones)
  const moveCard = useGameStore(s => s.moveCard)

  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState('hand')

  if (activeDialog !== 'search') return null

  const deckCards = zones['deck']?.cards ?? []
  const q = filter.toLowerCase()
  const filtered = deckCards.filter(gc =>
    !q ||
    gc.card.name.toLowerCase().includes(q) ||
    gc.card.civilizations.some(c => c.toLowerCase().includes(q)) ||
    gc.card.card_type.toLowerCase().includes(q),
  )

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleClose() {
    setSelected(new Set())
    setFilter('')
    closeDialog()
  }

  function handleMove() {
    const targetLabel = MOVE_TARGETS.find(t => t.id === target)?.label ?? target
    for (const id of selected) {
      const name = deckCards.find(c => c.instanceId === id)?.card.name ?? 'カード'
      moveCard('deck', id, target)
      addLog(`サーチ: ${name} → ${targetLabel}`)
    }
    handleClose()
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
    width: 480,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
    fontFamily: "'Chakra Petch', sans-serif",
  }
  const title: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 11,
    color: '#00FFFF',
    textShadow: '0 0 10px rgba(0,255,255,0.5)',
    marginBottom: 4,
  }
  const input: React.CSSProperties = {
    background: '#0e1228',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 6,
    color: '#aabbd0',
    padding: '6px 10px',
    fontSize: 13,
    fontFamily: "'Chakra Petch', sans-serif",
    outline: 'none',
    width: '100%',
  }
  const listWrap: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    border: '1px solid rgba(124,58,237,0.15)',
    borderRadius: 6,
    maxHeight: 320,
  }
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    color: '#aabbd0',
    fontSize: 12,
    transition: 'background 100ms',
  }
  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 150ms',
  }
  const selectStyle: React.CSSProperties = {
    background: '#0e1228',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 6,
    color: '#aabbd0',
    padding: '6px 10px',
    fontSize: 12,
    fontFamily: "'Chakra Petch', sans-serif",
    outline: 'none',
  }

  return (
    <div style={overlay} onClick={handleClose}>
      <div style={dialog} onClick={e => e.stopPropagation()}>
        <div style={title}>DECK SEARCH</div>
        <div style={{ color: '#505c78', fontSize: 11 }}>
          山札: {deckCards.length}枚 / 選択: {selected.size}枚
        </div>

        <input
          style={input}
          placeholder="カード名・文明・タイプで検索…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          autoFocus
        />

        <div style={listWrap}>
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: '#505c78', fontSize: 12, textAlign: 'center' }}>
              該当カードなし
            </div>
          )}
          {filtered.map(gc => (
            <div
              key={gc.instanceId}
              style={{
                ...row,
                background: selected.has(gc.instanceId) ? 'rgba(124,58,237,0.2)' : '',
              }}
              onMouseEnter={e => {
                if (!selected.has(gc.instanceId))
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)'
              }}
              onMouseLeave={e => {
                if (!selected.has(gc.instanceId))
                  e.currentTarget.style.background = ''
              }}
              onClick={() => toggle(gc.instanceId)}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                border: '1px solid rgba(124,58,237,0.5)',
                background: selected.has(gc.instanceId) ? '#7C3AED' : 'transparent',
                flexShrink: 0,
              }} />
              <span style={{ flex: 1 }}>{gc.card.name}</span>
              <span style={{ color: '#505c78', fontSize: 11 }}>
                {gc.card.civilizations.join('/')} • {gc.card.card_type}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#505c78', fontSize: 12 }}>移動先:</span>
          <select
            style={selectStyle}
            value={target}
            onChange={e => setTarget(e.target.value)}
          >
            {MOVE_TARGETS.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            style={{ ...btn, background: '#1a1a2e', color: '#505c78', border: '1px solid #303050' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#22223a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
            onClick={handleClose}
          >
            キャンセル
          </button>
          <button
            style={{
              ...btn,
              background: selected.size > 0 ? '#4c1d95' : '#1a1a2e',
              color: selected.size > 0 ? '#c4b5fd' : '#505c78',
              border: `1px solid ${selected.size > 0 ? '#7C3AED' : '#303050'}`,
            }}
            onMouseEnter={e => {
              if (selected.size > 0) e.currentTarget.style.background = '#5b21b6'
            }}
            onMouseLeave={e => {
              if (selected.size > 0) e.currentTarget.style.background = '#4c1d95'
            }}
            onClick={handleMove}
            disabled={selected.size === 0}
          >
            移動 ({selected.size})
          </button>
        </div>
      </div>
    </div>
  )
}
