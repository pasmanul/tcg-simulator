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
  background: 'var(--btn-zone-bg)',
  border: 'var(--btn-zone-border)',
  color: 'var(--btn-zone-color)',
  lineHeight: 1.4,
  transition: 'background 150ms, color 150ms',
  whiteSpace: 'nowrap' as const,
}

export function ZoneOverlayButtons({ zoneDef, x, y, width, height }: Props) {
  const { tapAllInZone, untapAllInZone, drawCard, shuffleZone, sortZone } = useGameStore(s => ({
    tapAllInZone: s.tapAllInZone,
    untapAllInZone: s.untapAllInZone,
    drawCard: s.drawCard,
    shuffleZone: s.shuffleZone,
    sortZone: s.sortZone,
  }))
  const addLog = useUIStore(s => s.addLog)

  const TITLE_H = 22
  const btnRight = x + width - 4

  // deck zone: DRAW + SHUFFLE at bottom of zone
  if (zoneDef.id === 'deck') {
    const btnY = y + height - 26
    return (
      <div style={{
        position: 'absolute',
        top: btnY,
        left: x + 4,
        right: `calc(100% - ${btnRight}px)`,
        display: 'flex',
        gap: 4,
        pointerEvents: 'all',
        zIndex: 10,
      }}>
        {[
          { label: 'DRAW', onClick: () => { drawCard(); addLog('ドロー') } },
          { label: 'SHUFFLE', onClick: () => { shuffleZone('deck'); addLog('山札シャッフル') } },
        ].map(b => (
          <button
            key={b.label}
            style={{ ...BTN, flex: 1, textAlign: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-zone-bg-hover)'; e.currentTarget.style.color = 'var(--btn-zone-color-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-zone-bg)'; e.currentTarget.style.color = 'var(--btn-zone-color)' }}
            onClick={b.onClick}
          >{b.label}</button>
        ))}
      </div>
    )
  }

  const btnY = y + TITLE_H + 2
  const buttons: { label: string; onClick: () => void }[] = []

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
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-zone-bg-hover)'; e.currentTarget.style.color = 'var(--btn-zone-color-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-zone-bg)'; e.currentTarget.style.color = 'var(--btn-zone-color)' }}
          onClick={b.onClick}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
