import { useState } from 'react'
import type { ZoneDefinition, WindowDefinition, GridPos } from '../../domain/types'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import { syncBoardConfigToLibrary } from '../../lib/boardConfigSync'

export const ZONE_TITLE_H = 22

type DragMode = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface DragState {
  mode: DragMode
  startClientX: number
  startClientY: number
  origGridPos: GridPos
}

interface ZoneEditHandleProps {
  zoneDef: ZoneDefinition
  x: number
  y: number
  width: number
  height: number
  stageWidth: number
  stageHeight: number
  winDef: WindowDefinition
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function computeNewPos(
  mode: DragMode,
  orig: GridPos,
  dCol: number,
  dRow: number,
  cols: number,
  rows: number,
): GridPos {
  if (mode === 'move') return {
    col: clamp(orig.col + dCol, 0, cols - orig.col_span),
    row: clamp(orig.row + dRow, 0, rows - orig.row_span),
    col_span: orig.col_span,
    row_span: orig.row_span,
  }
  let { col, row, col_span, row_span } = orig
  if (mode.includes('e')) col_span = clamp(orig.col_span + dCol, 1, cols - orig.col)
  if (mode.includes('w')) { col = clamp(orig.col + dCol, 0, orig.col + orig.col_span - 1); col_span = orig.col + orig.col_span - col }
  if (mode.includes('s')) row_span = clamp(orig.row_span + dRow, 1, rows - orig.row)
  if (mode.includes('n')) { row = clamp(orig.row + dRow, 0, orig.row + orig.row_span - 1); row_span = orig.row + orig.row_span - row }
  return { col, row, col_span, row_span }
}

const HANDLES: Array<{ mode: Exclude<DragMode, 'move'>; style: React.CSSProperties }> = [
  { mode: 'n',  style: { top: 0, left: '20%', right: '20%', height: 6, cursor: 'ns-resize' } },
  { mode: 's',  style: { bottom: 0, left: '20%', right: '20%', height: 6, cursor: 'ns-resize' } },
  { mode: 'e',  style: { right: 0, top: '20%', bottom: '20%', width: 6, cursor: 'ew-resize' } },
  { mode: 'w',  style: { left: 0, top: '20%', bottom: '20%', width: 6, cursor: 'ew-resize' } },
  { mode: 'ne', style: { top: 0, right: 0, width: 8, height: 8, cursor: 'nesw-resize' } },
  { mode: 'nw', style: { top: 0, left: 0, width: 8, height: 8, cursor: 'nwse-resize' } },
  { mode: 'se', style: { bottom: 0, right: 0, width: 8, height: 8, cursor: 'nwse-resize' } },
  { mode: 'sw', style: { bottom: 0, left: 0, width: 8, height: 8, cursor: 'nesw-resize' } },
]

function ZoneEditHandle({ zoneDef, x, y, width, height, stageWidth, stageHeight, winDef }: ZoneEditHandleProps) {
  const [hovered, setHovered] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const updateZone = useLayoutStore(s => s.updateZone)
  const { toggleZoneUnlock, isZoneUnlocked, setEditingZoneId } = useUIStore(s => ({
    toggleZoneUnlock: s.toggleZoneUnlock,
    isZoneUnlocked: s.isZoneUnlocked,
    setEditingZoneId: s.setEditingZoneId,
  }))
  const unlocked = isZoneUnlocked(zoneDef.id)
  const cols = winDef.grid_cols
  const rows = winDef.grid_rows

  function startDrag(e: React.PointerEvent, mode: DragMode) {
    if (!unlocked) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origGridPos: { ...zoneDef.grid_pos },
    })
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState) return
    const cellW = stageWidth / cols
    const cellH = stageHeight / rows
    const dCol = Math.round((e.clientX - dragState.startClientX) / cellW)
    const dRow = Math.round((e.clientY - dragState.startClientY) / cellH)
    const newPos = computeNewPos(dragState.mode, dragState.origGridPos, dCol, dRow, cols, rows)
    updateZone(zoneDef.id, { grid_pos: newPos })
  }

  function handlePointerUp() {
    if (!dragState) return
    setDragState(null)
    syncBoardConfigToLibrary()
  }

  const btnStyle: React.CSSProperties = {
    background: 'rgba(8,9,26,0.92)',
    border: '1px solid rgba(124,58,237,0.6)',
    borderRadius: 3,
    width: 20,
    height: 20,
    fontSize: 11,
    lineHeight: 1,
    cursor: 'pointer',
    pointerEvents: 'all',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: hovered ? 1 : 0,
    transition: 'opacity 120ms',
    flexShrink: 0,
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        pointerEvents: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* タイトルバー */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: ZONE_TITLE_H,
          pointerEvents: 'all',
          cursor: unlocked ? (dragState ? 'grabbing' : 'grab') : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 3,
          paddingRight: 4,
          boxSizing: 'border-box',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerDown={e => startDrag(e, 'move')}
      >
        <button
          style={{ ...btnStyle, color: '#a78bfa' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,9,26,0.92)' }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setEditingZoneId(zoneDef.id) }}
          title="プロパティ編集"
        >✏</button>
        <button
          style={{ ...btnStyle, color: unlocked ? '#6ee7b7' : '#fbbf24' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,9,26,0.92)' }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); toggleZoneUnlock(zoneDef.id) }}
          title={unlocked ? 'ロック（移動不可）' : 'アンロック（移動可）'}
        >{unlocked ? '🔓' : '🔒'}</button>
      </div>

      {/* リサイズハンドル（アンロック時のみ） */}
      {unlocked && HANDLES.map(({ mode, style }) => (
        <div
          key={mode}
          style={{
            position: 'absolute',
            background: 'rgba(124,58,237,0.35)',
            border: '1px solid rgba(167,139,250,0.6)',
            borderRadius: 2,
            pointerEvents: 'all',
            ...style,
          }}
          onPointerDown={e => startDrag(e, mode)}
        />
      ))}

      {/* アンロック時: ゾーン外枠ハイライト */}
      {unlocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '1px dashed rgba(110,231,183,0.5)',
          borderRadius: 2,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

interface ZoneEditOverlayContainerProps {
  zoneDefs: ZoneDefinition[]
  zoneRects: Array<{ zd: ZoneDefinition; rect: { x: number; y: number; width: number; height: number } | null }>
  stageWidth: number
  stageHeight: number
  winDef: WindowDefinition
}

export function ZoneEditOverlay({ zoneDefs: _zoneDefs, zoneRects, stageWidth, stageHeight, winDef }: ZoneEditOverlayContainerProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {zoneRects
        .filter(({ zd }) => !zd.source_zone_id && !zd.ui_widget)
        .map(({ zd, rect }) => rect && (
          <ZoneEditHandle
            key={zd.id}
            zoneDef={zd}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            stageWidth={stageWidth}
            stageHeight={stageHeight}
            winDef={winDef}
          />
        ))
      }
    </div>
  )
}
