import { useState, useRef } from 'react'
import type { GameConfigJson, ZoneDefinition, WindowDefinition } from '../../domain/types'
import { useSkin } from '../skin/SkinContext'

interface Props {
  initialConfig: GameConfigJson
  onSave: (config: GameConfigJson) => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  color: 'var(--text)',
  border: '1px solid rgba(var(--purple-rgb),0.3)',
  borderRadius: 3,
  padding: '4px 7px',
  fontSize: 11,
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
}

const numStyle: React.CSSProperties = {
  ...inputStyle,
  width: 60,
}

export function BoardEditorDialog({ initialConfig, onSave, onClose }: Props) {
  const { Button } = useSkin()
  const [windows, setWindows] = useState<WindowDefinition[]>([...initialConfig.windows])
  const [zones, setZones] = useState<ZoneDefinition[]>([...initialConfig.zones])
  const [selWindowId, setSelWindowId] = useState(initialConfig.windows[0]?.id ?? '')
  const [selZoneId, setSelZoneId] = useState<string | null>(null)
  type DragMode = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  type GridPos = ZoneDefinition['grid_pos']

  const [dragState, setDragState] = useState<{
    zoneId: string
    mode: DragMode
    origPos: GridPos
    startX: number
    startY: number
    currentPos: GridPos
  } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const selWindow = windows.find(w => w.id === selWindowId)
  const windowZones = zones.filter(z => z.window_id === selWindowId)
  const selZone = zones.find(z => z.id === selZoneId)

  const cols = selWindow?.grid_cols ?? 12
  const rows = selWindow?.grid_rows ?? 10
  const MAX_W = 800
  const MAX_H = 480
  const cellSize = Math.min(MAX_W / cols, MAX_H / rows)
  const previewW = Math.round(cellSize * cols)
  const previewH = Math.round(cellSize * rows)

  function addZone() {
    const id = `zone_${Date.now()}`
    const newZone: ZoneDefinition = {
      id,
      name: 'New Zone',
      window_id: selWindowId,
      grid_pos: { col: 0, row: 0, col_span: 3, row_span: 3 },
      visibility: 'public',
      pile_mode: false,
      tappable: false,
      card_scale: 1.0,
      two_row: false,
      masked: false,
    }
    setZones(z => [...z, newZone])
    setSelZoneId(id)
  }

  function deleteZone(id: string) {
    setZones(z => z.filter(zone => zone.id !== id))
    if (selZoneId === id) setSelZoneId(null)
  }

  function patchZoneById(id: string, patch: Partial<ZoneDefinition>) {
    setZones(z => z.map(zone => zone.id === id ? { ...zone, ...patch } : zone))
  }

  function patchZone(patch: Partial<ZoneDefinition>) {
    if (!selZoneId) return
    const oldId = selZoneId
    patchZoneById(oldId, patch)
    if ('id' in patch && patch.id !== undefined && patch.id !== oldId) {
      setSelZoneId(patch.id)
    }
  }

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

  function computeNewPos(mode: DragMode, orig: GridPos, dCol: number, dRow: number): GridPos {
    if (mode === 'move') return {
      col: clamp(orig.col + dCol, 0, cols - orig.col_span),
      row: clamp(orig.row + dRow, 0, rows - orig.row_span),
      col_span: orig.col_span, row_span: orig.row_span,
    }
    let { col, row, col_span, row_span } = orig
    if (mode.includes('e')) col_span = clamp(orig.col_span + dCol, 1, cols - orig.col)
    if (mode.includes('w')) { col = clamp(orig.col + dCol, 0, orig.col + orig.col_span - 1); col_span = orig.col + orig.col_span - col }
    if (mode.includes('s')) row_span = clamp(orig.row_span + dRow, 1, rows - orig.row)
    if (mode.includes('n')) { row = clamp(orig.row + dRow, 0, orig.row + orig.row_span - 1); row_span = orig.row + orig.row_span - row }
    return { col, row, col_span, row_span }
  }

  function startDrag(e: React.PointerEvent, zone: ZoneDefinition, mode: DragMode) {
    e.stopPropagation()
    setSelZoneId(zone.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({ zoneId: zone.id, mode, origPos: { ...zone.grid_pos }, startX: e.clientX, startY: e.clientY, currentPos: { ...zone.grid_pos } })
  }

  function handlePointerMove(e: React.PointerEvent, zone: ZoneDefinition) {
    if (!dragState || dragState.zoneId !== zone.id) return
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    const dCol = Math.round((e.clientX - dragState.startX) / (rect.width / cols))
    const dRow = Math.round((e.clientY - dragState.startY) / (rect.height / rows))
    const newPos = computeNewPos(dragState.mode, dragState.origPos, dCol, dRow)
    if (JSON.stringify(newPos) !== JSON.stringify(dragState.currentPos)) {
      setDragState(s => s ? { ...s, currentPos: newPos } : null)
    }
  }

  function handlePointerUp(e: React.PointerEvent, zone: ZoneDefinition) {
    if (!dragState || dragState.zoneId !== zone.id) return
    patchZoneById(zone.id, { grid_pos: dragState.currentPos })
    setDragState(null)
  }

  const HANDLES: Array<{ mode: DragMode; style: React.CSSProperties }> = [
    { mode: 'n',  style: { top: 0, left: '20%', right: '20%', height: 6, cursor: 'ns-resize' } },
    { mode: 's',  style: { bottom: 0, left: '20%', right: '20%', height: 6, cursor: 'ns-resize' } },
    { mode: 'e',  style: { right: 0, top: '20%', bottom: '20%', width: 6, cursor: 'ew-resize' } },
    { mode: 'w',  style: { left: 0, top: '20%', bottom: '20%', width: 6, cursor: 'ew-resize' } },
    { mode: 'ne', style: { top: 0, right: 0, width: 8, height: 8, cursor: 'nesw-resize' } },
    { mode: 'nw', style: { top: 0, left: 0, width: 8, height: 8, cursor: 'nwse-resize' } },
    { mode: 'se', style: { bottom: 0, right: 0, width: 8, height: 8, cursor: 'nwse-resize' } },
    { mode: 'sw', style: { bottom: 0, left: 0, width: 8, height: 8, cursor: 'nesw-resize' } },
  ]

  function patchGridPos(pos: Partial<ZoneDefinition['grid_pos']>) {
    if (!selZone) return
    patchZone({ grid_pos: { ...selZone.grid_pos, ...pos } })
  }

  function patchWindow(patch: Partial<WindowDefinition>) {
    setWindows(w => w.map(win => win.id === selWindowId ? { ...win, ...patch } : win))
  }

  const CHECKS: Array<[keyof ZoneDefinition, string]> = [
    ['pile_mode', 'パイルモード（山札）'],
    ['tappable', 'タップ可能'],
    ['masked', '常に裏面表示'],
    ['show_face_up', '強制表面表示（手札等）'],
  ]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl flex flex-col overflow-hidden font-body"
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(var(--purple-rgb),0.4)',
          width: '95vw',
          height: '95vh',
          boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(var(--purple-rgb),0.2)' }}
        >
          <span className="font-mono text-[10px]" style={{ color: 'var(--purple-lite)', textShadow: '0 0 12px rgba(var(--purple-rgb),0.5)' }}>
            BOARD EDITOR
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)' }} onClick={onClose}>
              キャンセル
            </Button>
            <Button
              variant="primary"
              style={{ background: '#4c1d95', color: 'var(--purple-lite)', border: 'none' }}
              onClick={() => onSave({ windows, zones })}
            >
              保存
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left: Zone List */}
          <div
            className="flex flex-col flex-shrink-0"
            style={{ width: 220, borderRight: '1px solid rgba(var(--purple-rgb),0.2)' }}
          >
            {/* Window selector */}
            <div
              className="flex-shrink-0"
              style={{ padding: '8px 8px 6px', borderBottom: '1px solid rgba(var(--purple-rgb),0.15)' }}
            >
              <div className="font-mono text-[9px] mb-1.5" style={{ color: 'var(--muted)' }}>WINDOW</div>
              <select
                value={selWindowId}
                onChange={e => { setSelWindowId(e.target.value); setSelZoneId(null) }}
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  color: 'var(--purple-lite)',
                  border: '1px solid rgba(var(--purple-rgb),0.4)',
                  borderRadius: 4,
                  padding: '5px 6px',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {windows.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>

            {/* Zone items */}
            <div className="flex-1 overflow-y-auto py-1">
              {windowZones.length === 0 && (
                <div className="px-2.5 py-3 font-body text-[10px] text-center" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                  ゾーンなし
                </div>
              )}
              {windowZones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => setSelZoneId(zone.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer"
                  style={{
                    background: zone.id === selZoneId ? 'rgba(var(--purple-rgb),0.15)' : 'transparent',
                    borderLeft: `3px solid ${zone.id === selZoneId ? 'var(--purple)' : 'transparent'}`,
                  }}
                >
                  <span className="text-[9px] flex-shrink-0" style={{ color: zone.visibility === 'public' ? '#3b82f6' : 'var(--purple)' }}>
                    {zone.visibility === 'public' ? '●' : '◆'}
                  </span>
                  <span className="font-body text-[10px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--purple-lite)' }}>
                    {zone.name}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteZone(zone.id) }}
                    className="flex-shrink-0 cursor-pointer leading-none"
                    style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, padding: '0 2px', opacity: 0.5 }}
                    title="削除"
                  >×</button>
                </div>
              ))}
            </div>

            {/* Add zone */}
            <div className="p-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(var(--purple-rgb),0.15)' }}>
              <Button
                variant="secondary"
                size="sm"
                style={{ width: '100%', background: 'rgba(var(--cyan-rgb),0.06)', color: 'var(--cyan)', border: '1px solid rgba(var(--cyan-rgb),0.25)' }}
                onClick={addZone}
              >
                + ゾーン追加
              </Button>
            </div>
          </div>

          {/* Right: Preview + Settings */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* Grid Preview */}
            <div
              className="flex-shrink-0 px-3.5 py-3"
              style={{ borderBottom: '1px solid rgba(var(--purple-rgb),0.15)', background: 'var(--bg2)' }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-[8px]" style={{ color: 'var(--muted)' }}>PREVIEW</span>
                <span className="font-body text-[10px]" style={{ color: 'var(--muted)', opacity: 0.5 }}>{cols} × {rows}</span>
                <span className="font-body text-[10px]" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: '#3b82f6' }}>●</span> 公開　<span style={{ color: 'var(--purple)' }}>◆</span> 非公開
                </span>
              </div>

              <div
                ref={previewRef}
                className="relative overflow-hidden select-none rounded"
                style={{
                  width: previewW,
                  height: previewH,
                  background: 'var(--bg)',
                  border: '1px solid rgba(var(--purple-rgb),0.2)',
                }}
              >
                {/* Grid lines */}
                {Array.from({ length: cols - 1 }).map((_, i) => (
                  <div key={`vc${i}`} style={{ position: 'absolute', left: `${(i + 1) / cols * 100}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.04)' }} />
                ))}
                {Array.from({ length: rows - 1 }).map((_, i) => (
                  <div key={`hr${i}`} style={{ position: 'absolute', top: `${(i + 1) / rows * 100}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.04)' }} />
                ))}
                {/* Zones */}
                {windowZones.map(zone => {
                  const isSel = zone.id === selZoneId
                  const isDragging = dragState?.zoneId === zone.id
                  const pos = isDragging ? dragState.currentPos : zone.grid_pos
                  const isPublic = zone.visibility === 'public'
                  const bg = isPublic
                    ? (isSel ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.28)')
                    : (isSel ? 'rgba(var(--purple-rgb),0.6)' : 'rgba(var(--purple-rgb),0.28)')
                  const border = isPublic ? '#3b82f6' : 'var(--purple)'
                  return (
                    <div
                      key={zone.id}
                      onPointerDown={e => startDrag(e, zone, 'move')}
                      onPointerMove={e => handlePointerMove(e, zone)}
                      onPointerUp={e => handlePointerUp(e, zone)}
                      onPointerCancel={() => setDragState(null)}
                      style={{
                        position: 'absolute',
                        left: `${pos.col / cols * 100}%`,
                        top: `${pos.row / rows * 100}%`,
                        width: `${pos.col_span / cols * 100}%`,
                        height: `${pos.row_span / rows * 100}%`,
                        background: bg,
                        border: `${isSel ? 2 : 1}px solid ${border}`,
                        borderRadius: 2,
                        cursor: isDragging && dragState?.mode === 'move' ? 'grabbing' : 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'visible',
                        boxSizing: 'border-box',
                        opacity: isDragging ? 0.85 : 1,
                        transition: isDragging ? 'none' : 'left 80ms, top 80ms, width 80ms, height 80ms',
                        zIndex: isDragging ? 10 : 1,
                      }}
                    >
                      <span style={{ fontSize: 8, color: '#fff', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.9)', padding: '0 2px', maxWidth: '100%', overflow: 'hidden', fontFamily: 'var(--font-body)', pointerEvents: 'none', position: 'relative', zIndex: 1 }}>
                        {zone.name}
                      </span>
                      {isSel && HANDLES.map(h => (
                        <div
                          key={h.mode}
                          style={{
                            position: 'absolute',
                            ...h.style,
                            background: 'rgba(255,255,255,0.18)',
                            zIndex: 4,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
                          onPointerDown={e => startDrag(e, zone, h.mode)}
                          onPointerMove={e => handlePointerMove(e, zone)}
                          onPointerUp={e => handlePointerUp(e, zone)}
                          onPointerCancel={() => setDragState(null)}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Grid size inputs */}
              <div className="mt-2 flex gap-3.5 items-center">
                <span className="font-body text-[10px]" style={{ color: 'var(--muted)' }}>グリッド:</span>
                <label className="flex items-center gap-1 font-body text-[10px]" style={{ color: 'var(--muted)' }}>
                  列
                  <input
                    type="number" min={1} max={24}
                    value={selWindow?.grid_cols ?? 12}
                    onChange={e => patchWindow({ grid_cols: Math.max(1, Number(e.target.value)) })}
                    style={numStyle}
                  />
                </label>
                <label className="flex items-center gap-1 font-body text-[10px]" style={{ color: 'var(--muted)' }}>
                  行
                  <input
                    type="number" min={1} max={24}
                    value={selWindow?.grid_rows ?? 10}
                    onChange={e => patchWindow({ grid_rows: Math.max(1, Number(e.target.value)) })}
                    style={numStyle}
                  />
                </label>
              </div>
            </div>

            {/* Zone Settings */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3">
              {selZone ? (
                <>
                  <div className="font-mono text-[7px] mb-2.5" style={{ color: 'var(--purple-lite)' }}>
                    ZONE SETTINGS
                  </div>
                  <div className="grid grid-cols-2 gap-x-3.5 gap-y-2">
                    <div>
                      <label className="block font-body text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>ID</label>
                      <input value={selZone.id} onChange={e => patchZone({ id: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block font-body text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>表示名</label>
                      <input value={selZone.name} onChange={e => patchZone({ name: e.target.value })} style={inputStyle} />
                    </div>

                    <div>
                      <label className="block font-body text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>列 (col)</label>
                      <input type="number" min={0} max={cols - 1} value={selZone.grid_pos.col} onChange={e => patchGridPos({ col: Number(e.target.value) })} style={numStyle} />
                    </div>
                    <div>
                      <label className="block font-body text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>行 (row)</label>
                      <input type="number" min={0} max={rows - 1} value={selZone.grid_pos.row} onChange={e => patchGridPos({ row: Number(e.target.value) })} style={numStyle} />
                    </div>
                    <div>
                      <label className="block font-body text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>列幅 (col_span)</label>
                      <input type="number" min={1} max={cols} value={selZone.grid_pos.col_span} onChange={e => patchGridPos({ col_span: Number(e.target.value) })} style={numStyle} />
                    </div>
                    <div>
                      <label className="block font-body text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>行高 (row_span)</label>
                      <input type="number" min={1} max={rows} value={selZone.grid_pos.row_span} onChange={e => patchGridPos({ row_span: Number(e.target.value) })} style={numStyle} />
                    </div>

                    <div className="col-span-2">
                      <label className="block font-body text-[10px] mb-1.5" style={{ color: 'var(--muted)' }}>公開設定</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => patchZone({ visibility: 'public' })}
                          className="px-3 py-1 rounded font-body text-xs cursor-pointer transition-all"
                          style={{
                            border: `1px solid ${selZone.visibility === 'public' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                            background: selZone.visibility === 'public' ? 'rgba(59,130,246,0.2)' : 'var(--surface2)',
                            color: selZone.visibility === 'public' ? '#60a5fa' : 'var(--muted)',
                          }}
                        >
                          ● 公開
                        </button>
                        <button
                          onClick={() => patchZone({ visibility: 'private' })}
                          className="px-3 py-1 rounded font-body text-xs cursor-pointer transition-all"
                          style={{
                            border: `1px solid ${selZone.visibility === 'private' ? 'var(--purple)' : 'rgba(255,255,255,0.1)'}`,
                            background: selZone.visibility === 'private' ? 'rgba(var(--purple-rgb),0.2)' : 'var(--surface2)',
                            color: selZone.visibility === 'private' ? 'var(--purple-lite)' : 'var(--muted)',
                          }}
                        >
                          ◆ 非公開
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-body text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>段数 (row_count)</label>
                      <input
                        type="number" min={1} max={8}
                        value={selZone.row_count ?? (selZone.two_row ? 2 : 1)}
                        onChange={e => patchZone({ row_count: Math.max(1, Number(e.target.value)), two_row: Number(e.target.value) >= 2 })}
                        style={numStyle}
                      />
                    </div>
                    <div />

                    <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1.5">
                      {CHECKS.map(([key, label]) => (
                        <label key={key as string} className="flex items-center gap-1.5 cursor-pointer font-body text-xs" style={{ color: 'var(--muted)' }}>
                          <input
                            type="checkbox"
                            checked={!!(selZone as unknown as Record<string, unknown>)[key as string]}
                            onChange={e => patchZone({ [key]: e.target.checked } as Partial<ZoneDefinition>)}
                            style={{ accentColor: 'var(--purple-lite)', cursor: 'pointer' }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="font-body text-xs text-center pt-7" style={{ color: 'var(--muted)', opacity: 0.4 }}>
                  ゾーンを選択してください
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
