import { useRef, useEffect, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import { useLayoutStore } from '../../store/layoutStore'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useStageSize, gridToPixel } from '../hooks/useStageSize'
import { ZoneGroup } from '../zones/ZoneGroup'
import { ZoneOverlayButtons } from '../zones/ZoneOverlayButtons'
import { TOKENS } from '../../theme'
import { findDropZone, type CardDropDetail } from './cardDropTarget'

export function BoardStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const size = useStageSize(containerRef)

  const zoneDefs = useLayoutStore(s => s.getWindowZones('board'))
  const winDef = useLayoutStore(s => s.getWindow('board'))
  const moveCard = useGameStore(s => s.moveCard)
  const addLog = useUIStore(s => s.addLog)
  const closeContextMenu = useUIStore(s => s.closeContextMenu)

  const handleCardDrop = useCallback((e: Event) => {
    const { fromZoneId, instanceId, dropX, dropY } = (e as CustomEvent<CardDropDetail>).detail
    if (!winDef || size.width === 0) return

    const targetZoneId = findDropZone(dropX, dropY, zoneDefs, winDef, size.width, size.height)
    if (targetZoneId && targetZoneId !== fromZoneId) {
      moveCard(fromZoneId, instanceId, targetZoneId)
      addLog(`カード移動 → ${zoneDefs.find(z => z.id === targetZoneId)?.name}`)
    }
  }, [zoneDefs, winDef, size, moveCard, addLog])

  useEffect(() => {
    window.addEventListener('card-drop', handleCardDrop)
    return () => window.removeEventListener('card-drop', handleCardDrop)
  }, [handleCardDrop])

  if (!winDef) return null

  const zoneRects = zoneDefs
    .filter(zd => !zd.ui_widget)
    .map(zd => ({
      zd,
      rect: size.width > 0
        ? gridToPixel(zd.grid_pos, winDef.grid_cols, winDef.grid_rows, size.width, size.height)
        : null,
    }))

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, background: TOKENS.bg, position: 'relative' }}
      onClick={() => closeContextMenu()}
    >
      {size.width > 0 && (
        <>
          <Stage width={size.width} height={size.height}>
            <Layer>
              {zoneRects.map(({ zd, rect }) => rect && (
                <ZoneGroup
                  key={zd.id}
                  zoneDef={zd}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                />
              ))}
            </Layer>
          </Stage>

          {/* Zone overlay buttons (DOM layer over canvas) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {zoneRects.map(({ zd, rect }) => rect && (
              <ZoneOverlayButtons
                key={zd.id}
                zoneDef={zd}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
