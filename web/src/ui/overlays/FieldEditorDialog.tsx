import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import type { FieldDef } from '../../domain/types'
import { FieldCard, ensureUniqueId } from './fieldDefShared'

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

export function FieldEditorDialog() {
  const { activeDialog, closeDialog } = useUIStore(s => ({ activeDialog: s.activeDialog, closeDialog: s.closeDialog }))
  const storeFieldDefs = useLibraryStore(s => s.fieldDefs)
  const { cards, decks, activeDeckIndex, applyLibrarySnapshot, save } = useLibraryStore(s => ({
    cards: s.cards,
    decks: s.decks,
    activeDeckIndex: s.activeDeckIndex,
    applyLibrarySnapshot: s.applyLibrarySnapshot,
    save: s.save,
  }))

  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([...storeFieldDefs])

  useEffect(() => {
    if (activeDialog === 'field-editor') {
      setFieldDefs([...storeFieldDefs])
    }
  }, [activeDialog]) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleSave() {
    applyLibrarySnapshot(cards, decks, activeDeckIndex, fieldDefs)
    await save()
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
