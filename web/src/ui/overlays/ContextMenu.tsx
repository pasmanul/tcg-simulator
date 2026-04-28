import { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { useLayoutStore } from '../../store/layoutStore'
import { logCardName } from '../../domain/gameLogic'

const MARKERS = [
  { id: 'red', label: '赤' },
  { id: 'blue', label: '青' },
  { id: 'green', label: '緑' },
  { id: 'yellow', label: '黄' },
  { id: null, label: 'なし' },
]

const MARKER_BG: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
}

export function ContextMenu() {
  const { contextMenu, closeContextMenu, addLog, openDialog, openStackDialog } = useUIStore(s => ({
    contextMenu: s.contextMenu,
    closeContextMenu: s.closeContextMenu,
    addLog: s.addLog,
    openDialog: s.openDialog,
    openStackDialog: s.openStackDialog,
  }))
  const { tapCard, flipCard, setMarker, moveCard } = useGameStore(s => ({
    tapCard: s.tapCard,
    flipCard: s.flipCard,
    setMarker: s.setMarker,
    moveCard: s.moveCard,
  }))
  const zoneDefs = useLayoutStore(s => s.zones)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeContextMenu()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [closeContextMenu])

  if (!contextMenu) return null

  const { x, y, zoneId, cardInstanceId, card } = contextMenu

  const srcZoneDef = zoneDefs.find(z => z.id === zoneId)

  function cardName(destZoneId?: string) {
    const destZoneDef = destZoneId ? zoneDefs.find(z => z.id === destZoneId) : undefined
    return logCardName(card, srcZoneDef, destZoneDef)
  }

  function action(fn: () => void) {
    fn()
    closeContextMenu()
  }

  // Build move targets from layout definitions
  const moveTargets = zoneDefs
    .filter(z => !z.source_zone_id && !z.ui_widget && z.id !== zoneId)
    .flatMap(z => z.pile_mode
      ? [
          { id: z.id, label: `${z.name}（上）`, toIndex: 0 as number | undefined },
          { id: z.id, label: `${z.name}（下）`, toIndex: undefined as number | undefined },
        ]
      : [{ id: z.id, label: z.name, toIndex: undefined as number | undefined }]
    )

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 300),
    width: 190,
    zIndex: 1000,
  }

  const itemBase = 'px-3.5 py-[7px] cursor-pointer text-text-base border-b border-white/[0.04] transition-colors duration-150 hover:bg-primary/15 font-body text-[12px]'
  const labelBase = 'px-3.5 py-1 text-muted text-[10px] font-mono uppercase tracking-wide'

  return (
    <div
      ref={ref}
      style={menuStyle}
      className="bg-surface border border-primary/40 rounded-theme overflow-hidden shadow-2xl font-body"
    >
      {/* Header */}
      <div className="px-3.5 py-1.5 bg-surface border-b border-white/[0.06] font-mono text-[10px] text-muted tracking-wide">
        {srcZoneDef?.visibility === 'private' || card.face_down ? '???' : card.card.name.slice(0, 18)}
      </div>

      {card.under_cards.length > 0 && (
        <div
          className="px-3.5 py-[7px] cursor-pointer border-b border-white/[0.04] transition-colors duration-150 hover:bg-orange-500/15 font-body text-[12px] text-orange-400"
          onClick={() => action(() => openStackDialog(card, zoneId))}
        >
          スタック確認 ({card.under_cards.length + 1})
        </div>
      )}

      {srcZoneDef?.pile_mode && (
        <div
          className="px-3.5 py-[7px] cursor-pointer border-b border-white/[0.04] transition-colors duration-150 hover:bg-accent/10 font-body text-[12px] text-accent"
          onClick={() => action(() => openDialog('search'))}
        >
          サーチ
        </div>
      )}

      <div
        className={itemBase}
        onClick={() => action(() => {
          tapCard(zoneId, cardInstanceId)
          addLog(`${cardName()} タップ/アンタップ`)
        })}
      >
        {card.tapped ? 'アンタップ' : 'タップ'}
      </div>

      <div
        className={itemBase}
        onClick={() => action(() => {
          flipCard(zoneId, cardInstanceId)
          addLog(`${cardName()} 裏返し`)
        })}
      >
        {card.face_down ? '表向きにする' : '裏向きにする'}
      </div>

      <div className={labelBase}>マーカー</div>
      {MARKERS.map(m => (
        <div
          key={String(m.id)}
          className="flex items-center gap-2 px-3.5 py-[7px] cursor-pointer border-b border-white/[0.04] transition-colors duration-150 hover:bg-primary/15 font-body text-[12px] text-text-base"
          onClick={() => action(() => setMarker(zoneId, cardInstanceId, m.id))}
        >
          {m.id && (
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${MARKER_BG[m.id] ?? 'bg-white'}`} />
          )}
          {m.label}
          {card.marker === m.id && ' ✓'}
        </div>
      ))}

      <div className={labelBase}>ゾーン移動</div>
      {moveTargets.map((z, i) => (
        <div
          key={`${z.id}-${i}`}
          className={itemBase}
          onClick={() => action(() => {
            moveCard(zoneId, cardInstanceId, z.id, z.toIndex)
            addLog(`${cardName(z.id)} → ${z.label}`)
          })}
        >
          → {z.label}
        </div>
      ))}
    </div>
  )
}
