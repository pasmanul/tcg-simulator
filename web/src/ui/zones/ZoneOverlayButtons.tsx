import type { ZoneDefinition } from '../../domain/types'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'

interface Props {
  zoneDef: ZoneDefinition
  x: number
  y: number
  width: number
  height: number
}

const BTN: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 7,
  padding: '3px 7px',
  borderRadius: 3,
  cursor: 'pointer',
  background: 'rgba(10,14,32,0.85)',
  border: '1px solid rgba(60,90,140,0.7)',
  color: '#99bbdd',
  lineHeight: 1.4,
  transition: 'background 150ms, color 150ms',
  whiteSpace: 'nowrap' as const,
}

export function ZoneOverlayButtons({ zoneDef, x, y, width }: Props) {
  const { tapAllInZone, untapAllInZone, drawCard, shuffleZone, sortZone } = useGameStore(s => ({
    tapAllInZone: s.tapAllInZone,
    untapAllInZone: s.untapAllInZone,
    drawCard: s.drawCard,
    shuffleZone: s.shuffleZone,
    sortZone: s.sortZone,
  }))
  const addLog = useUIStore(s => s.addLog)

  const TITLE_H = 22  // same as ZoneGroup
  const btnY = y + TITLE_H + 2
  const btnRight = x + width - 4

  const buttons: { label: string; onClick: () => void }[] = []

  if (zoneDef.id === 'deck') {
    buttons.push(
      { label: 'DRAW', onClick: () => { drawCard(); addLog('ドロー') } },
      { label: 'SHUFFLE', onClick: () => { shuffleZone('deck'); addLog('山札シャッフル') } },
    )
  }

  if (zoneDef.visibility === 'public' || zoneDef.id === 'hand') {
    buttons.push({
      label: 'SORT',
      onClick: () => { sortZone(zoneDef.id); addLog(`${zoneDef.name} ソート`) },
    })
  }

  if (zoneDef.tappable) {
    buttons.push(
      { label: 'UNTAP', onClick: () => { untapAllInZone(zoneDef.id); addLog(`${zoneDef.name} 全アンタップ`) } },
      { label: 'TAP', onClick: () => { tapAllInZone(zoneDef.id); addLog(`${zoneDef.name} 全タップ`) } },
    )
  }

  if (buttons.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: btnY,
        right: `calc(100% - ${btnRight}px)`,
        left: x + 4,
        display: 'flex',
        gap: 4,
        pointerEvents: 'all',
        zIndex: 10,
        flexWrap: 'wrap',
      }}
    >
      {buttons.map(b => (
        <button
          key={b.label}
          style={BTN}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(30,50,100,0.9)'
            e.currentTarget.style.color = '#cce0ff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(10,14,32,0.85)'
            e.currentTarget.style.color = '#99bbdd'
          }}
          onClick={b.onClick}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
