import { useRef, useEffect, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import { useLayoutStore } from '../../store/layoutStore'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useStageSize, gridToPixel } from '../hooks/useStageSize'
import { ZoneGroup } from '../zones/ZoneGroup'
import { ZoneOverlayButtons } from '../zones/ZoneOverlayButtons'
import { DeckListPanel } from '../zones/DeckListPanel'
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
      className="flex-1 bg-bg relative flex flex-col overflow-hidden min-h-0"
      onClick={() => closeContextMenu()}
    >
      {/* Konva stage for hand + temp zones */}
      <div
        ref={containerRef}
        style={{
          flex: deckListZone
            ? `0 0 ${Math.round(winDef.height * deckListZone.grid_pos.row / winDef.grid_rows)}px`
            : '1',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {size.width > 0 && (
          <>
          <Stage width={size.width} height={size.height}>
            <Layer>
              {konvaZones.map(zd => {
                // Konva キャンバスは rows 0 〜 (deckListZone.row-1) のみ担当するため
                // grid_rows にはその行数を使う（全体の grid_rows ではなく）
                const konvaGridRows = deckListZone ? deckListZone.grid_pos.row : winDef.grid_rows
                const rect = gridToPixel(
                  zd.grid_pos,
                  winDef.grid_cols,
                  konvaGridRows,
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

          {/* Zone overlay buttons (DOM layer over canvas) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {konvaZones.map(zd => {
              const konvaGridRows = deckListZone ? deckListZone.grid_pos.row : winDef.grid_rows
              const rect = gridToPixel(zd.grid_pos, winDef.grid_cols, konvaGridRows, size.width, size.height)
              return (
                <ZoneOverlayButtons
                  key={zd.id}
                  zoneDef={zd}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                />
              )
            })}
          </div>
          </>
        )}
      </div>

      {/* DeckList panel as DOM overlay */}
      {deckListZone && (
        <DeckListPanel style={{ flex: 1, minHeight: 0 }} />
      )}
    </div>
  )
}
