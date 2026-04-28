import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import type { FieldDef } from '../../domain/types'
import { FieldCard, ensureUniqueId } from './fieldDefShared'
import { Dialog } from '../components/Dialog'
import { Button } from '../components/Button'

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
    <Dialog
      open={activeDialog === 'field-editor'}
      onClose={closeDialog}
      title="CARD FIELDS"
      width="max-w-[560px]"
    >
      <p className="font-body text-sm mb-4" style={{ color: 'var(--muted)' }}>
        カードが持つ属性フィールドを編集します。
      </p>

      <div className="flex flex-col gap-2 mb-4">
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
          <div className="text-center font-body text-xs py-4" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            フィールドなし
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        style={{ background: 'rgba(var(--cyan-rgb),0.08)', color: 'var(--cyan)', border: '1px solid rgba(var(--cyan-rgb),0.3)' }}
        onClick={addField}
      >
        ＋ フィールドを追加
      </Button>

      <div className="flex gap-2 justify-end mt-4">
        <Button variant="secondary" onClick={closeDialog}>
          キャンセル
        </Button>
        <Button
          variant="primary"
          style={{ background: 'linear-gradient(135deg, #00aa88, #006655)', color: '#fff', border: 'none' }}
          onClick={handleSave}
        >
          保存
        </Button>
      </div>
    </Dialog>
  )
}
