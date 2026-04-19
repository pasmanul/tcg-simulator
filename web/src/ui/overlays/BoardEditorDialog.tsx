import { useState, useRef } from 'react'
import type { GameConfigJson, ZoneDefinition, WindowDefinition } from '../../domain/types'

interface Props {
  initialConfig: GameConfigJson
  onSave: (config: GameConfigJson) => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0e1a',
  color: '#E2E8F0',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 3,
  padding: '4px 7px',
  fontSize: 11,
  fontFamily: "'Chakra Petch', sans-serif",
  boxSizing: 'border-box',
}

const numStyle: React.CSSProperties = {
  ...inputStyle,
  width: 60,
}

export function BoardEditorDialog({ initialConfig, onSave, onClose }: Props) {
  const [windows, setWindows] = useState<WindowDefinition[]>([...initialConfig.windows])
  const [zones, setZones] = useState<ZoneDefinition[]>([...initialConfig.zones])
  const [selWindowId, setSelWindowId] = useState(initialConfig.windows[0]?.id ?? '')
  const [selZoneId, setSelZoneId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{
    zoneId: string
    origCol: number
    origRow: number
    startX: number
    startY: number
    currentCol: number
    currentRow: number
  } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const selWindow = windows.find(w => w.id === selWindowId)
  const windowZones = zones.filter(z => z.window_id === selWindowId)
  const selZone = zones.find(z => z.id === selZoneId)

  const cols = selWindow?.grid_cols ?? 12
  const rows = selWindow?.grid_rows ?? 10
  const previewW = 360
  const previewH = Math.round(previewW * rows / cols)

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

  function handleZonePointerDown(e: React.PointerEvent, zone: ZoneDefinition) {
    e.stopPropagation()
    setSelZoneId(zone.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({
      zoneId: zone.id,
      origCol: zone.grid_pos.col,
      origRow: zone.grid_pos.row,
      startX: e.clientX,
      startY: e.clientY,
      currentCol: zone.grid_pos.col,
      currentRow: zone.grid_pos.row,
    })
  }

  function handleZonePointerMove(e: React.PointerEvent, zone: ZoneDefinition) {
    if (!dragState || dragState.zoneId !== zone.id) return
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    const cellW = rect.width / cols
    const cellH = rect.height / rows
    const newCol = Math.max(0, Math.min(cols - zone.grid_pos.col_span,
      Math.round(dragState.origCol + (e.clientX - dragState.startX) / cellW)))
    const newRow = Math.max(0, Math.min(rows - zone.grid_pos.row_span,
      Math.round(dragState.origRow + (e.clientY - dragState.startY) / cellH)))
    if (newCol !== dragState.currentCol || newRow !== dragState.currentRow) {
      setDragState(s => s ? { ...s, currentCol: newCol, currentRow: newRow } : null)
    }
  }

  function handleZonePointerUp(e: React.PointerEvent, zone: ZoneDefinition) {
    if (!dragState || dragState.zoneId !== zone.id) return
    patchZoneById(zone.id, {
      grid_pos: { ...zone.grid_pos, col: dragState.currentCol, row: dragState.currentRow },
    })
    setDragState(null)
  }

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
    ['two_row', '2段レイアウト'],
    ['masked', '常に裏面表示'],
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0a0d1c', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 14, width: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,0,0,0.8)', fontFamily: "'Chakra Petch', sans-serif", overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(124,58,237,0.2)', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#A78BFA', textShadow: '0 0 12px rgba(167,139,250,0.5)' }}>
            BOARD EDITOR
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#505c78', borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Chakra Petch', sans-serif", fontSize: 11 }}
            >
              キャンセル
            </button>
            <button
              onClick={() => onSave({ windows, zones })}
              style={{ background: '#4c1d95', border: 'none', color: '#c4b5fd', borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}
            >
              保存
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Left: Zone List */}
          <div style={{ width: 190, borderRight: '1px solid rgba(124,58,237,0.2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

            {/* Window tabs */}
            <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(124,58,237,0.15)', flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {windows.map(w => (
                <button
                  key={w.id}
                  onClick={() => { setSelWindowId(w.id); setSelZoneId(null) }}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 6,
                    padding: '3px 6px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: `1px solid ${w.id === selWindowId ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`,
                    background: w.id === selWindowId ? '#3b0764' : '#0a0d1c',
                    color: w.id === selWindowId ? '#c4b5fd' : '#505c78',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w.title}
                </button>
              ))}
            </div>

            {/* Zone items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {windowZones.length === 0 && (
                <div style={{ padding: '12px 10px', color: '#334', fontSize: 10, textAlign: 'center' }}>ゾーンなし</div>
              )}
              {windowZones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => setSelZoneId(zone.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    background: zone.id === selZoneId ? 'rgba(124,58,237,0.15)' : 'transparent',
                    borderLeft: `3px solid ${zone.id === selZoneId ? '#7c3aed' : 'transparent'}`,
                  }}
                >
                  <span style={{ fontSize: 9, flexShrink: 0, color: zone.visibility === 'public' ? '#3b82f6' : '#7c3aed' }}>
                    {zone.visibility === 'public' ? '●' : '◆'}
                  </span>
                  <span style={{ fontSize: 10, color: '#c4b5fd', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {zone.name}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteZone(zone.id) }}
                    style={{ background: 'transparent', border: 'none', color: '#503050', cursor: 'pointer', fontSize: 13, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}
                    title="削除"
                  >×</button>
                </div>
              ))}
            </div>

            {/* Add zone */}
            <div style={{ padding: '8px', borderTop: '1px solid rgba(124,58,237,0.15)', flexShrink: 0 }}>
              <button
                onClick={addZone}
                style={{ width: '100%', padding: '6px', background: '#0a1a0a', border: '1px solid #204020', borderRadius: 5, color: '#66dd66', fontFamily: "'Press Start 2P', monospace", fontSize: 6, cursor: 'pointer' }}
              >
                + ゾーン追加
              </button>
            </div>
          </div>

          {/* Right: Preview + Settings */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Grid Preview */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(124,58,237,0.15)', flexShrink: 0, background: '#07091a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#505c78' }}>PREVIEW</span>
                <span style={{ fontSize: 10, color: '#334' }}>{cols} × {rows}</span>
                <span style={{ fontSize: 10, color: '#505c78' }}>
                  <span style={{ color: '#3b82f6' }}>●</span> 公開　<span style={{ color: '#7c3aed' }}>◆</span> 非公開
                </span>
              </div>

              <div
                ref={previewRef}
                style={{ position: 'relative', width: previewW, height: previewH, background: '#050710', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, overflow: 'hidden', userSelect: 'none' }}
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
                  const displayCol = isDragging ? dragState.currentCol : zone.grid_pos.col
                  const displayRow = isDragging ? dragState.currentRow : zone.grid_pos.row
                  const isPublic = zone.visibility === 'public'
                  const bg = isPublic
                    ? (isSel ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.28)')
                    : (isSel ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.28)')
                  const border = isPublic ? '#3b82f6' : '#7c3aed'
                  return (
                    <div
                      key={zone.id}
                      onPointerDown={e => handleZonePointerDown(e, zone)}
                      onPointerMove={e => handleZonePointerMove(e, zone)}
                      onPointerUp={e => handleZonePointerUp(e, zone)}
                      onPointerCancel={() => setDragState(null)}
                      style={{
                        position: 'absolute',
                        left: `${displayCol / cols * 100}%`,
                        top: `${displayRow / rows * 100}%`,
                        width: `${zone.grid_pos.col_span / cols * 100}%`,
                        height: `${zone.grid_pos.row_span / rows * 100}%`,
                        background: bg,
                        border: `${isSel ? 2 : 1}px solid ${border}`,
                        borderRadius: 2,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                        opacity: isDragging ? 0.85 : 1,
                        transition: isDragging ? 'none' : 'left 80ms, top 80ms',
                        zIndex: isDragging ? 10 : 1,
                      }}
                    >
                      <span style={{ fontSize: 8, color: '#fff', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.9)', padding: '0 2px', maxWidth: '100%', overflow: 'hidden', fontFamily: "'Chakra Petch', sans-serif", pointerEvents: 'none' }}>
                        {zone.name}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Grid size inputs */}
              <div style={{ marginTop: 8, display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#505c78' }}>グリッド:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94A3B8' }}>
                  列
                  <input
                    type="number" min={1} max={24}
                    value={selWindow?.grid_cols ?? 12}
                    onChange={e => patchWindow({ grid_cols: Math.max(1, Number(e.target.value)) })}
                    style={numStyle}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94A3B8' }}>
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              {selZone ? (
                <>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#A78BFA', marginBottom: 10 }}>
                    ZONE SETTINGS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#505c78', marginBottom: 3 }}>ID</label>
                      <input
                        value={selZone.id}
                        onChange={e => patchZone({ id: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#505c78', marginBottom: 3 }}>表示名</label>
                      <input
                        value={selZone.name}
                        onChange={e => patchZone({ name: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#505c78', marginBottom: 3 }}>列 (col)</label>
                      <input
                        type="number" min={0} max={cols - 1}
                        value={selZone.grid_pos.col}
                        onChange={e => patchGridPos({ col: Number(e.target.value) })}
                        style={numStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#505c78', marginBottom: 3 }}>行 (row)</label>
                      <input
                        type="number" min={0} max={rows - 1}
                        value={selZone.grid_pos.row}
                        onChange={e => patchGridPos({ row: Number(e.target.value) })}
                        style={numStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#505c78', marginBottom: 3 }}>列幅 (col_span)</label>
                      <input
                        type="number" min={1} max={cols}
                        value={selZone.grid_pos.col_span}
                        onChange={e => patchGridPos({ col_span: Number(e.target.value) })}
                        style={numStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#505c78', marginBottom: 3 }}>行高 (row_span)</label>
                      <input
                        type="number" min={1} max={rows}
                        value={selZone.grid_pos.row_span}
                        onChange={e => patchGridPos({ row_span: Number(e.target.value) })}
                        style={numStyle}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 10, color: '#505c78', marginBottom: 5 }}>公開設定</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => patchZone({ visibility: 'public' })}
                          style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${selZone.visibility === 'public' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, background: selZone.visibility === 'public' ? 'rgba(59,130,246,0.2)' : '#0a0e1a', color: selZone.visibility === 'public' ? '#60a5fa' : '#505c78', fontFamily: "'Chakra Petch', sans-serif", fontSize: 11 }}
                        >
                          ● 公開
                        </button>
                        <button
                          onClick={() => patchZone({ visibility: 'private' })}
                          style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${selZone.visibility === 'private' ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`, background: selZone.visibility === 'private' ? 'rgba(124,58,237,0.2)' : '#0a0e1a', color: selZone.visibility === 'private' ? '#A78BFA' : '#505c78', fontFamily: "'Chakra Petch', sans-serif", fontSize: 11 }}
                        >
                          ◆ 非公開
                        </button>
                      </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                      {CHECKS.map(([key, label]) => (
                        <label key={key as string} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: '#94A3B8' }}>
                          <input
                            type="checkbox"
                            checked={!!(selZone as unknown as Record<string, unknown>)[key as string]}
                            onChange={e => patchZone({ [key]: e.target.checked } as Partial<ZoneDefinition>)}
                            style={{ accentColor: '#A78BFA', cursor: 'pointer' }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: '#334', fontSize: 11, textAlign: 'center', paddingTop: 28, fontFamily: "'Chakra Petch', sans-serif" }}>
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
