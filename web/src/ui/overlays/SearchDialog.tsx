import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { Dialog } from '../components/Dialog'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Select } from '../components/Select'

const MOVE_TARGETS = [
  { id: 'hand', label: '手札' },
  { id: 'mana', label: 'マナゾーン' },
  { id: 'graveyard', label: '墓地' },
  { id: 'temp', label: '保留' },
]

export function SearchDialog() {
  const { activeDialog, closeDialog, addLog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    addLog: s.addLog,
  }))
  const zones = useGameStore(s => s.zones)
  const moveCard = useGameStore(s => s.moveCard)

  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState('hand')

  const deckCards = zones['deck']?.cards ?? []
  const q = filter.toLowerCase()
  const filtered = deckCards.filter(gc => {
    if (!q) return true
    if (gc.card.name.toLowerCase().includes(q)) return true
    return Object.values(gc.card.fields).some(v => {
      if (typeof v === 'string') return v.toLowerCase().includes(q)
      if (Array.isArray(v)) return v.some(item => typeof item === 'string' && item.toLowerCase().includes(q))
      return false
    })
  })

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleClose() {
    setSelected(new Set())
    setFilter('')
    closeDialog()
  }

  function handleMove() {
    const targetLabel = MOVE_TARGETS.find(t => t.id === target)?.label ?? target
    for (const id of selected) {
      const name = deckCards.find(c => c.instanceId === id)?.card.name ?? 'カード'
      moveCard('deck', id, target)
      addLog(`サーチ: ${name} → ${targetLabel}`)
    }
    handleClose()
  }

  return (
    <Dialog
      open={activeDialog === 'search'}
      onClose={handleClose}
      title="DECK SEARCH"
      width="max-w-lg"
    >
      <div className="flex flex-col gap-3">
        <p className="text-muted text-[11px] font-body">
          山札: {deckCards.length}枚 / 選択: {selected.size}枚
        </p>

        <Input
          placeholder="カード名・フィールド値で検索…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          autoFocus
        />

        {/* List */}
        <div className="border border-primary/15 rounded-theme overflow-y-auto max-h-72">
          {filtered.length === 0 && (
            <p className="p-4 text-muted text-[12px] text-center font-body">該当カードなし</p>
          )}
          {filtered.map(gc => (
            <div
              key={gc.instanceId}
              className={`flex items-center gap-2.5 px-3 py-1.5 border-b border-white/[0.04] cursor-pointer transition-colors duration-100 font-body text-[12px] text-text-base
                ${selected.has(gc.instanceId) ? 'bg-primary/20' : 'hover:bg-primary/8'}`}
              onClick={() => toggle(gc.instanceId)}
            >
              <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border border-primary/50 transition-colors duration-100
                ${selected.has(gc.instanceId) ? 'bg-primary' : 'bg-transparent'}`}
              />
              <span className="flex-1">{gc.card.name}</span>
            </div>
          ))}
        </div>

        {/* Move target row */}
        <div className="flex items-center gap-2">
          <span className="text-muted text-[12px] font-body flex-shrink-0">移動先:</span>
          <Select
            options={MOVE_TARGETS.map(t => ({ value: t.id, label: t.label }))}
            value={target}
            onChange={e => setTarget(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={handleClose}>キャンセル</Button>
          <Button
            variant="primary"
            onClick={handleMove}
            disabled={selected.size === 0}
          >
            移動 ({selected.size})
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
