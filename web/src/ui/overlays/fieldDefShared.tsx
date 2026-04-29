import { useState } from 'react'
import type { FieldDef } from '../../domain/types'
import { useSkin } from '../skin/SkinContext'

export function labelToId(label: string): string {
  const ascii = label
    .normalize('NFKC')
    .replace(/[　-鿿＀-￯]/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
  return ascii || 'field'
}

export function ensureUniqueId(base: string, existingIds: string[]): string {
  if (!existingIds.includes(base)) return base
  let n = 2
  while (existingIds.includes(`${base}_${n}`)) n++
  return `${base}_${n}`
}

export const TYPE_OPTIONS: { value: FieldDef['type']; label: string }[] = [
  { value: 'text',         label: 'テキスト' },
  { value: 'number',       label: '数値' },
  { value: 'select',       label: '選択肢（一つ）' },
  { value: 'multi-select', label: '複数選択' },
]

const cellInput: React.CSSProperties = {
  background: 'var(--surface2)',
  color: 'var(--text)',
  border: '1px solid rgba(var(--purple-rgb),0.3)',
  borderRadius: 4,
  padding: '6px 9px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  boxSizing: 'border-box' as const,
  width: '100%',
}

export interface FieldCardProps {
  field: FieldDef
  onChange: (field: FieldDef) => void
  onDelete: () => void
  allIds: string[]
}

export function FieldCard({ field, onChange, onDelete, allIds }: FieldCardProps) {
  const { Button } = useSkin()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [optionInput, setOptionInput] = useState('')
  const needsOptions = field.type === 'select' || field.type === 'multi-select'

  function handleLabelChange(newLabel: string) {
    const base = labelToId(newLabel) || 'field'
    onChange({ ...field, label: newLabel, id: ensureUniqueId(base, allIds) })
  }

  function addOption(raw: string) {
    const val = raw.trim()
    if (!val) return
    const opts = field.options ?? []
    if (!opts.includes(val)) onChange({ ...field, options: [...opts, val] })
    setOptionInput('')
  }

  function removeOption(opt: string) {
    onChange({ ...field, options: (field.options ?? []).filter(o => o !== opt) })
  }

  return (
    <div
      className="rounded-lg flex flex-col gap-2.5"
      style={{
        background: 'var(--surface2)',
        border: '1px solid rgba(var(--purple-rgb),0.25)',
        padding: '12px 14px',
      }}
    >
      <div className="flex gap-2 items-center">
        <input
          style={{ ...cellInput, flex: 1, fontSize: 13 }}
          value={field.label}
          onChange={e => handleLabelChange(e.target.value)}
          placeholder="表示名（例: マナコスト）"
        />
        <Button variant="danger" size="sm" onClick={onDelete}>×</Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TYPE_OPTIONS.map(opt => {
          const active = field.type === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ ...field, type: opt.value, options: opt.value === 'text' || opt.value === 'number' ? undefined : field.options })}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                border: `1px solid ${active ? 'var(--purple)' : 'rgba(var(--purple-rgb),0.15)'}`,
                background: active ? 'rgba(var(--purple-rgb),0.2)' : 'transparent',
                color: active ? 'var(--purple-lite)' : 'var(--muted)',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {needsOptions && (
        <div>
          <div className="font-body text-[10px] mb-1.5" style={{ color: 'var(--muted)' }}>選択肢</div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {(field.options ?? []).map(opt => (
              <span
                key={opt}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-body text-xs"
                style={{
                  background: 'rgba(var(--purple-rgb),0.12)',
                  border: '1px solid rgba(var(--purple-rgb),0.3)',
                  color: 'var(--purple-lite)',
                }}
              >
                {opt}
                <span
                  onClick={() => removeOption(opt)}
                  className="cursor-pointer"
                  style={{ color: 'var(--purple)', fontSize: 12, lineHeight: 1 }}
                >×</span>
              </span>
            ))}
          </div>
          <input
            style={{ ...cellInput, width: 180 }}
            value={optionInput}
            onChange={e => setOptionInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addOption(optionInput) } }}
            onBlur={() => addOption(optionInput)}
            placeholder="Enterで追加"
          />
        </div>
      )}

      <div>
        <button
          onClick={() => setShowAdvanced(s => !s)}
          className="font-body text-[10px] cursor-pointer"
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', padding: 0 }}
        >
          {showAdvanced ? '▼' : '▶'} 詳細設定
        </button>
        {showAdvanced && (
          <div className="flex flex-col gap-1.5 mt-2 pl-2.5">
            <label className="flex items-center gap-2 cursor-pointer font-body text-xs" style={{ color: 'var(--muted)' }}>
              <input
                type="checkbox"
                style={{ accentColor: 'var(--purple-lite)', cursor: 'pointer' }}
                checked={!!field.sortable}
                onChange={e => onChange({ ...field, sortable: e.target.checked })}
              />
              並び替えを有効にする
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-body text-xs" style={{ color: 'var(--muted)' }}>
              <input
                type="checkbox"
                style={{ accentColor: 'var(--purple-lite)', cursor: 'pointer' }}
                checked={!!field.filterable}
                onChange={e => onChange({ ...field, filterable: e.target.checked })}
              />
              絞り込みを有効にする
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
