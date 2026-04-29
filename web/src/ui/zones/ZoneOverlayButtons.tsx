import type { ZoneDefinition } from '../../domain/types'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useSkin } from '../skin/SkinContext'

interface Props {
  zoneDef: ZoneDefinition
  x: number
  y: number
  width: number
  height: number
}

export function ZoneOverlayButtons({ zoneDef, x, y, width, height }: Props) {
  const { Button } = useSkin()
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

  if (zoneDef.id === 'deck') {
    const btnY = y + height - 26
    return (
      <div style={{
        position: 'absolute',
        top: btnY,
        left: x + 4,
        right: `calc(100% - ${btnRight}px)`,
        pointerEvents: 'all',
        zIndex: 10,
      }} className="flex gap-1">
        {[
          { label: 'DRAW', onClick: () => { drawCard(); addLog('ドロー') } },
          { label: 'SHUFFLE', onClick: () => { shuffleZone('deck'); addLog('山札シャッフル') } },
        ].map(b => (
          <Button
            key={b.label}
            size="sm"
            variant="ghost"
            className="flex-1 text-center"
            style={{ background: 'var(--btn-zone-bg)', borderColor: 'var(--btn-zone-border)', color: 'var(--btn-zone-color)' }}
            onClick={b.onClick}
          >
            {b.label}
          </Button>
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
        pointerEvents: 'all',
        zIndex: 10,
      }}
      className="flex gap-1 flex-wrap"
    >
      {buttons.map(b => (
        <Button
          key={b.label}
          size="sm"
          variant="ghost"
          style={{ background: 'var(--btn-zone-bg)', borderColor: 'var(--btn-zone-border)', color: 'var(--btn-zone-color)' }}
          onClick={b.onClick}
        >
          {b.label}
        </Button>
      ))}
    </div>
  )
}
