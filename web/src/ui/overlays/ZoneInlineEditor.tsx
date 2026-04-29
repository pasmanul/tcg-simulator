import { useLayoutStore } from '../../store/layoutStore'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { syncBoardConfigToLibrary } from '../../lib/boardConfigSync'
import type { ZoneDefinition } from '../../domain/types'
import { useSkin } from '../skin/SkinContext'

interface Props {
  zoneId: string
  onClose: () => void
}

const CHECKS: Array<[keyof ZoneDefinition, string]> = [
  ['pile_mode', 'パイルモード（山札）'],
  ['tappable', 'タップ可能'],
  ['masked', '常に裏面表示'],
  ['show_face_up', '強制表面表示（手札等）'],
]

export function ZoneInlineEditor({ zoneId, onClose }: Props) {
  const { Button, Input } = useSkin()
  const zoneDef = useLayoutStore(s => s.zones.find(z => z.id === zoneId))
  const updateZone = useLayoutStore(s => s.updateZone)
  const removeZone = useLayoutStore(s => s.removeZone)
  const removeZoneFromGame = useGameStore(s => s.removeZoneFromGame)

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
    <div className="fixed inset-0 z-[2100] flex items-center justify-center pointer-events-none">
      <div className="w-[280px] bg-surface border border-primary/50 rounded-theme shadow-[0_0_32px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-primary/20 bg-bg">
          <span className="font-mono text-[8px] text-primary-lite">ZONE EDIT</span>
          <button
            onClick={handleClose}
            className="bg-transparent border-0 text-muted text-lg cursor-pointer leading-none hover:text-text-base transition-colors duration-150"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-3.5 flex flex-col gap-2.5">
          {/* Name */}
          <Input
            label="NAME"
            value={zoneDef.name}
            onChange={e => patch({ name: e.target.value })}
          />

          {/* Visibility */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[8px] text-muted">VISIBILITY</span>
            <div className="flex gap-1.5">
              {(['public', 'private'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => patch({ visibility: v })}
                  className={`flex-1 py-1.5 rounded-theme cursor-pointer font-mono text-[7px] transition-colors duration-150 border
                    ${zoneDef.visibility === v
                      ? 'bg-primary/35 border-primary text-primary-lite'
                      : 'bg-transparent border-primary/20 text-muted hover:border-primary/50'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Row count */}
          <Input
            label="ROW COUNT"
            type="number"
            min={1}
            max={8}
            className="w-[70px]"
            value={zoneDef.row_count ?? (zoneDef.two_row ? 2 : 1)}
            onChange={e => {
              const v = Math.max(1, Math.min(8, Number(e.target.value)))
              patch({ row_count: v, two_row: v >= 2 })
            }}
          />

          {/* Checkboxes */}
          <div className="flex flex-col gap-1.5">
            {CHECKS.map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer text-[11px] text-muted font-body"
              >
                <input
                  type="checkbox"
                  checked={!!(zoneDef[key])}
                  onChange={e => patch({ [key]: e.target.checked })}
                  className="w-3 h-3 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>

          {/* Position (read-only) */}
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[8px] text-muted">POSITION (drag to move)</span>
            <span className="text-[10px] text-muted/60 font-body">
              col={col}, row={row} / span {col_span}×{row_span}
            </span>
          </div>

          {/* Delete */}
          <Button variant="danger" onClick={handleDelete} className="w-full justify-center mt-1">
            DELETE ZONE
          </Button>
        </div>
      </div>
    </div>
  )
}
