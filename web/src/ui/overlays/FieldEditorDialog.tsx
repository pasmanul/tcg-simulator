import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import type { FieldDef } from '../../domain/types'

// ──────────────────────────────────────────────
// ユーティリティ（GameSetupWizard と同一）
// ──────────────────────────────────────────────
function labelToId(label: string): string {
  const ascii = label
    .normalize('NFKC')
    .replace(/[\u3000-\u9fff\uff00-\uffef]/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
  return ascii || 'field'
}

function ensureUniqueId(base: string, existingIds: string[]): string {
  if (!existingIds.includes(base)) return base
  let n = 2
  while (existingIds.includes(`${base}_${n}`)) n++
  return `${base}_${n}`
}

const TYPE_OPTIONS: { value: FieldDef['type']; label: string }[] = [
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

const addBtn: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 7,
  padding: '6px 12px',
  borderRadius: 5,
  cursor: 'pointer',
  background: '#0a1a0a',
  color: '#66dd66',
  border: '1px solid #204020',
}

// ──────────────────────────────────────────────
// FieldCard
// ──────────────────────────────────────────────
interface FieldCardProps {
  field: FieldDef
  onChange: (field: FieldDef) => void
  onDelete: () => void
  allIds: string[]
}

function FieldCard({ field, onChange, onDelete, allIds }: FieldCardProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [optionInput, setOptionInput] = useState('')
  const needsOptions = field.type === 'select' || field.type === 'multi-select'

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

  function handleLabelChange(newLabel: string) {
    const base = labelToId(newLabel) || 'field'
    const newId = ensureUniqueId(base, allIds)
    onChange({ ...field, label: newLabel, id: newId })
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
          placeholder="表示名（例: コスト）"
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

// ──────────────────────────────────────────────
// FieldEditorDialog 本体
// ──────────────────────────────────────────────
export function FieldEditorDialog() {
  const { activeDialog, closeDialog } = useUIStore(s => ({ activeDialog: s.activeDialog, closeDialog: s.closeDialog }))
  const storeFieldDefs = useLibraryStore(s => s.fieldDefs)
  const applyLibrarySnapshot = useLibraryStore(s => s.applyLibrarySnapshot)

  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([...storeFieldDefs])

  if (activeDialog !== 'field-editor') return null

  function addField() {
    setFieldDefs(prev => [...prev, {
      id: ensureUniqueId('field', prev.map(f => f.id)),
      label: '',
      type: 'text',
      sortable: false,
      filterable: false,
    }])
  }

  function updateField(i: number, field: FieldDef) {
    setFieldDefs(prev => prev.map((f, idx) => idx === i ? field : f))
  }

  function deleteField(i: number) {
    setFieldDefs(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    const s = useLibraryStore.getState()
    applyLibrarySnapshot(s.cards, s.decks, s.activeDeckIndex, fieldDefs)
    closeDialog()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={closeDialog}
    >
      <div
        style={{ background: '#0e1228', border: '1px solid rgba(0,255,200,0.3)', borderRadius: 16, padding: 24, width: 560, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 0 60px rgba(0,200,150,0.15)', fontFamily: "'Chakra Petch', sans-serif", display: 'flex', flexDirection: 'column', gap: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#00FFD0', textShadow: '0 0 12px rgba(0,255,200,0.5)' }}>
            CARD FIELDS
          </span>
          <button onClick={closeDialog} style={{ background: 'transparent', border: 'none', color: '#505c78', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>
          カードが持つ属性フィールドを編集します。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fieldDefs.map((f, i) => (
            <FieldCard
              key={f.id + i}
              field={f}
              onChange={field => updateField(i, field)}
              onDelete={() => deleteField(i)}
              allIds={fieldDefs.map(fd => fd.id).filter(id => id !== f.id)}
            />
          ))}
          {fieldDefs.length === 0 && (
            <div style={{ textAlign: 'center', color: '#334', fontSize: 12, padding: '16px 0' }}>フィールドなし</div>
          )}
        </div>

        <button style={addBtn} onClick={addField}>＋ フィールドを追加</button>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={closeDialog} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: '#505c78', border: '1px solid rgba(255,255,255,0.1)' }}>
            キャンセル
          </button>
          <button onClick={handleSave} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', background: 'linear-gradient(135deg, #00aa88, #006655)', color: '#fff', border: 'none' }}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
