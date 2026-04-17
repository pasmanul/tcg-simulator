import { useRef, useEffect, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import { useLayoutStore } from '../../store/layoutStore'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useStageSize, gridToPixel } from '../hooks/useStageSize'
import { ZoneGroup } from '../zones/ZoneGroup'
import { DeckListPanel } from '../zones/DeckListPanel'
import { TOKENS } from '../../theme'
import { findDropZone, type CardDropDetail } from './cardDropTarget'

export function HandStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const size = useStageSize(containerRef)

  const zoneDefs = useLayoutStore(s => s.getWindowZones('hand'))
  const winDef = useLayoutStore(s => s.getWindow('hand'))
  const moveCard = useGameStore(s => s.moveCard)
  const addLog = useUIStore(s => s.addLog)
  const closeContextMenu = useUIStore(s => s.closeContextMenu)

  const konvaZones = zoneDefs.filter(zd => !zd.ui_widget)
  const deckListZone = zoneDefs.find(zd => zd.ui_widget === 'deck_list')

  const handleCardDrop = useCallback((e: Event) => {
    const { fromZoneId, instanceId, dropX, dropY } = (e as CustomEvent<CardDropDetail>).detail
    if (!winDef || size.width === 0) return

    const targetZoneId = findDropZone(dropX, dropY, konvaZones, winDef, size.width, size.height)
    if (targetZoneId && targetZoneId !== fromZoneId) {
      moveCard(fromZoneId, instanceId, targetZoneId)
      addLog(`カード移動 → ${zoneDefs.find(z => z.id === targetZoneId)?.name}`)
    }
  }, [konvaZones, zoneDefs, winDef, size, moveCard, addLog])

  useEffect(() => {
    window.addEventListener('card-drop', handleCardDrop)
    return () => window.removeEventListener('card-drop', handleCardDrop)
  }, [handleCardDrop])

  if (!winDef) return null

  // DeckList zone pixel rect
  const deckListRect = deckListZone
    ? gridToPixel(
        deckListZone.grid_pos,
        winDef.grid_cols,
        winDef.grid_rows,
        // Use fixed sizes since hand window has known dimensions
        size.width || winDef.width,
        size.height || winDef.height,
      )
    : null

  return (
    <div
      style={{ flex: 1, background: TOKENS.bg, position: 'relative', display: 'flex', flexDirection: 'column' }}
      onClick={() => closeContextMenu()}
    >
      {/* Konva stage for hand + temp zones */}
      <div
        ref={containerRef}
        style={{
          flex: deckListZone
            ? `0 0 ${(deckListZone.grid_pos.row / winDef.grid_rows) * 100}%`
            : '1',
          position: 'relative',
        }}
      >
        {size.width > 0 && (
          <Stage width={size.width} height={size.height}>
            <Layer>
              {konvaZones.map(zd => {
                const rect = gridToPixel(
                  zd.grid_pos,
                  winDef.grid_cols,
                  winDef.grid_rows,
                  size.width,
                  size.height,
                )
                return (
                  <ZoneGroup
                    key={zd.id}
                    zoneDef={zd}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                  />
                )
              })}
            </Layer>
          </Stage>
        )}
      </div>

      {/* DeckList panel as DOM overlay */}
      {deckListZone && (
        <DeckListPanel style={{ flex: 1 }} />
      )}
    </div>
  )
}
