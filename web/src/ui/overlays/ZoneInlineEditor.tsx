import { useLayoutStore } from '../../store/layoutStore'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { syncBoardConfigToLibrary } from '../../lib/boardConfigSync'
import type { ZoneDefinition } from '../../domain/types'

interface Props {
  zoneId: string
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  background: '#0a0e1a',
  color: '#E2E8F0',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 3,
  padding: '4px 7px',
  fontSize: 11,
  fontFamily: "'Chakra Petch', sans-serif",
  width: '100%',
  boxSizing: 'border-box',
}

const CHECKS: Array<[keyof ZoneDefinition, string]> = [
  ['pile_mode', 'パイルモード（山札）'],
  ['tappable', 'タップ可能'],
  ['masked', '常に裏面表示'],
  ['show_face_up', '強制表面表示（手札等）'],
]

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  color: '#7c8ab0',
  fontFamily: "'Press Start 2P', monospace",
  display: 'block',
  marginBottom: 3,
}

const rowStyle: React.CSSProperties = {
  marginBottom: 10,
}

export function ZoneInlineEditor({ zoneId, onClose }: Props) {
  const zoneDef = useLayoutStore(s => s.zones.find(z => z.id === zoneId))
  const updateZone = useLayoutStore(s => s.updateZone)
  const removeZone = useLayoutStore(s => s.removeZone)
  const removeZoneFromGame = useGameStore(s => s.removeZoneFromGame)
  const unlockedZoneIds = useUIStore(s => s.unlockedZoneIds)

  if (!zoneDef) return null

  function patch(p: Partial<ZoneDefinition>) {
    updateZone(zoneId, p)
  }

  function handleClose() {
    syncBoardConfigToLibrary()
    onClose()
  }

  function handleDelete() {
    if (!confirm(`「${zoneDef!.name}」を削除しますか？\nゾーン内のカードは全て消えます。`)) return
    removeZone(zoneId)
    removeZoneFromGame(zoneId)
    // unlockedZoneIds からも除去
    useUIStore.setState(s => {
      const next = new Set(s.unlockedZoneIds)
      next.delete(zoneId)
      return { unlockedZoneIds: next }
    })
    syncBoardConfigToLibrary()
    onClose()
  }

  const { col, row, col_span, row_span } = zoneDef.grid_pos

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 280,
          background: '#08091e',
          border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: 8,
          boxShadow: '0 0 32px rgba(0,0,0,0.8)',
          fontFamily: "'Chakra Petch', sans-serif",
          pointerEvents: 'all',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(124,58,237,0.2)',
          background: '#060810',
        }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#a78bfa' }}>
            ZONE EDIT
          </span>
          <button
            onClick={handleClose}
            style={{ background: 'transparent', border: 'none', color: '#505c78', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>

        {/* フォーム */}
        <div style={{ padding: '12px 14px' }}>
          {/* 名前 */}
          <div style={rowStyle}>
            <label style={labelStyle}>NAME</label>
            <input
              style={inputStyle}
              value={zoneDef.name}
              onChange={e => patch({ name: e.target.value })}
            />
          </div>

          {/* visibility */}
          <div style={rowStyle}>
            <label style={labelStyle}>VISIBILITY</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['public', 'private'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => patch({ visibility: v })}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 7,
                    background: zoneDef.visibility === v ? 'rgba(124,58,237,0.35)' : 'transparent',
                    border: `1px solid ${zoneDef.visibility === v ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`,
                    color: zoneDef.visibility === v ? '#c4b5fd' : '#505c78',
                  }}
                >{v}</button>
              ))}
            </div>
          </div>

          {/* row_count */}
          <div style={rowStyle}>
            <label style={labelStyle}>ROW COUNT</label>
            <input
              type="number"
              min={1}
              max={8}
              style={{ ...inputStyle, width: 70 }}
              value={zoneDef.row_count ?? (zoneDef.two_row ? 2 : 1)}
              onChange={e => {
                const v = Math.max(1, Math.min(8, Number(e.target.value)))
                patch({ row_count: v, two_row: v >= 2 })
              }}
            />
          </div>

          {/* チェックボックス群 */}
          <div style={{ ...rowStyle, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CHECKS.map(([key, label]) => (
              <label
                key={key}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: '#a0b0cc' }}
              >
                <input
                  type="checkbox"
                  checked={!!(zoneDef[key])}
                  onChange={e => patch({ [key]: e.target.checked })}
                  style={{ width: 13, height: 13, accentColor: '#7c3aed' }}
                />
                {label}
              </label>
            ))}
          </div>

          {/* 位置（参照表示のみ） */}
          <div style={{ ...rowStyle, marginTop: 6 }}>
            <label style={labelStyle}>POSITION (drag to move)</label>
            <span style={{ fontSize: 10, color: '#505c78' }}>
              col={col}, row={row} / span {col_span}×{row_span}
            </span>
          </div>

          {/* 削除ボタン */}
          <button
            onClick={handleDelete}
            style={{
              width: '100%',
              padding: '7px 0',
              borderRadius: 5,
              cursor: 'pointer',
              background: 'rgba(127,29,29,0.3)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#fca5a5',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              marginTop: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,28,28,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(127,29,29,0.3)' }}
          >DELETE ZONE</button>
        </div>
      </div>
    </div>
  )
}
