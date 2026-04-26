import { useState } from 'react'
import type { FieldDef } from '../../domain/types'

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

const dangerBtn: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 7,
  padding: '4px 8px',
  borderRadius: 4,
  cursor: 'pointer',
  background: '#200c0c',
  color: '#dd6666',
  border: '1px solid #502828',
}

const cellInput: React.CSSProperties = {
  background: '#0a0e1a',
  color: '#E2E8F0',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 4,
  padding: '6px 9px',
  fontFamily: "'Chakra Petch', sans-serif",
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
    <div style={{
      background: '#0a0e1a',
      border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: 8,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          style={{ ...cellInput, flex: 1, fontSize: 13 }}
          value={field.label}
          onChange={e => handleLabelChange(e.target.value)}
          placeholder="表示名（例: マナコスト）"
        />
        <button style={dangerBtn} onClick={onDelete}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TYPE_OPTIONS.map(opt => {
          const active = field.type === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ ...field, type: opt.value, options: opt.value === 'text' || opt.value === 'number' ? undefined : field.options })}
              style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                border: `1px solid ${active ? '#7c3aed' : '#1e2540'}`,
                background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: active ? '#A78BFA' : '#505c78',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {needsOptions && (
        <div>
          <div style={{ fontSize: 10, color: '#505c78', marginBottom: 5, fontFamily: "'Chakra Petch', sans-serif" }}>選択肢</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {(field.options ?? []).map(opt => (
              <span key={opt} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 4,
                padding: '2px 7px',
                fontSize: 11,
                color: '#c4b5fd',
                fontFamily: "'Chakra Petch', sans-serif",
              }}>
                {opt}
                <span onClick={() => removeOption(opt)} style={{ cursor: 'pointer', color: '#7c3aed', fontSize: 12, lineHeight: 1 }}>×</span>
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
          style={{ background: 'transparent', border: 'none', color: '#505c78', cursor: 'pointer', fontSize: 10, fontFamily: "'Chakra Petch', sans-serif", padding: 0 }}
        >
          {showAdvanced ? '▼' : '▶'} 詳細設定
        </button>
        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingLeft: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: '#94A3B8', fontFamily: "'Chakra Petch', sans-serif" }}>
              <input type="checkbox" style={{ accentColor: '#A78BFA', cursor: 'pointer' }} checked={!!field.sortable} onChange={e => onChange({ ...field, sortable: e.target.checked })} />
              並び替えを有効にする
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: '#94A3B8', fontFamily: "'Chakra Petch', sans-serif" }}>
              <input type="checkbox" style={{ accentColor: '#A78BFA', cursor: 'pointer' }} checked={!!field.filterable} onChange={e => onChange({ ...field, filterable: e.target.checked })} />
              絞り込みを有効にする
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
