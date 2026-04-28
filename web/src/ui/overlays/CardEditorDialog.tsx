import { useState, useRef, useEffect } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import type { Card, FieldDef } from '../../domain/types'
import { labelToId, ensureUniqueId } from './fieldDefShared'
import { Dialog } from '../components/Dialog'
import { Button } from '../components/Button'

type NewFieldType = FieldDef['type']

interface Props {
  onClose: () => void
  card?: Card
}

const inp: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  color: 'var(--text)',
  border: '1px solid rgba(var(--purple-rgb),0.4)',
  borderRadius: 4,
  padding: '6px 10px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: 11,
  marginBottom: 4,
  marginTop: 14,
}

export function CardEditorDialog({ onClose, card }: Props) {
  const { fieldDefs, fileHandle, addCard, updateCard, deleteCard, addFieldDef } = useLibraryStore(s => ({
    fieldDefs: s.fieldDefs,
    fileHandle: s.fileHandle,
    addCard: s.addCard,
    updateCard: s.updateCard,
    deleteCard: s.deleteCard,
    addFieldDef: s.addFieldDef,
  }))

  const isEdit = !!card

  function buildInitialFields(): Record<string, any> {
    if (isEdit && card) return { ...card.fields }
    const init: Record<string, any> = {}
    for (const def of fieldDefs) {
      if (def.default !== undefined) init[def.id] = def.default
    }
    return init
  }

  const [name, setName] = useState(card?.name ?? '')
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(buildInitialFields)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(card?.image_data ?? null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [showAddField, setShowAddField] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<NewFieldType>('text')
  const [newFieldOptions, setNewFieldOptions] = useState('')
  const [addFieldError, setAddFieldError] = useState('')

  async function handleAddField() {
    const label = newFieldLabel.trim()
    if (!label) { setAddFieldError('ラベルを入力'); return }
    const id = ensureUniqueId(labelToId(label) || 'field', fieldDefs.map(f => f.id))
    const def: FieldDef = {
      id,
      label,
      type: newFieldType,
      ...(newFieldType === 'select' || newFieldType === 'multi-select'
        ? { options: newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) }
        : {}),
      sortable: true,
      filterable: true,
    }
    try {
      await addFieldDef(def)
      setNewFieldLabel('')
      setNewFieldType('text')
      setNewFieldOptions('')
      setShowAddField(false)
      setAddFieldError('')
    } catch {
      setAddFieldError('保存失敗')
    }
  }

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(file ? URL.createObjectURL(file) : (card?.image_data ?? null))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('カード名を入力してください'); return }
    if (!fileHandle) { setError('先にゲームプロファイルを読み込んでください'); return }
    setSaving(true)
    setError('')
    try {
      if (isEdit && card) {
        await updateCard(card.id, name.trim(), fieldValues, imageFile ?? undefined)
      } else {
        await addCard(name.trim(), fieldValues, imageFile ?? undefined)
      }
      onClose()
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!card) return
    setSaving(true)
    try {
      await deleteCard(card.id)
      onClose()
    } catch {
      setError('削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  function setField(id: string, value: any) {
    setFieldValues(prev => ({ ...prev, [id]: value }))
  }

  function renderField(def: FieldDef) {
    switch (def.type) {
      case 'number':
        return (
          <input
            style={{ ...inp, width: 100 }}
            type="number"
            value={fieldValues[def.id] ?? ''}
            onChange={e => setField(def.id, Number(e.target.value))}
          />
        )
      case 'text':
        return (
          <input
            style={inp}
            type="text"
            value={fieldValues[def.id] ?? ''}
            onChange={e => setField(def.id, e.target.value)}
          />
        )
      case 'select':
        return (
          <select
            style={inp}
            value={fieldValues[def.id] ?? ''}
            onChange={e => setField(def.id, e.target.value)}
          >
            <option value="">（選択）</option>
            {def.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )
      case 'multi-select':
        return (
          <div className="flex gap-2 flex-wrap">
            {def.options?.map(o => {
              const cur: string[] = Array.isArray(fieldValues[def.id]) ? fieldValues[def.id] : []
              const active = cur.includes(o)
              return (
                <label
                  key={o}
                  className="flex items-center gap-1 cursor-pointer font-body text-xs select-none transition-colors duration-100"
                  style={{ color: active ? 'var(--purple-lite)' : 'var(--muted)' }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => {
                      const next = e.target.checked ? [...cur, o] : cur.filter(x => x !== o)
                      setField(def.id, next)
                    }}
                    style={{ accentColor: 'var(--purple-lite)' }}
                  />
                  {o}
                </label>
              )
            })}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      width="max-w-[800px]"
      className="!bg-surface2"
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-mono text-[11px]" style={{ color: 'var(--cyan)', textShadow: '0 0 16px rgba(var(--cyan-rgb),0.6)' }}>
          {isEdit ? 'EDIT CARD' : 'ADD CARD'}
        </h2>
        {isEdit && !confirmDelete && (
          <Button
            variant="danger"
            size="sm"
            type="button"
            onClick={() => setConfirmDelete(true)}
          >
            削除
          </Button>
        )}
      </div>

      {confirmDelete && (
        <div
          className="rounded-lg p-2.5 mb-3 flex items-center gap-2.5"
          style={{ background: 'rgba(var(--pink-rgb),0.08)', border: '1px solid rgba(var(--pink-rgb),0.3)' }}
        >
          <span className="font-body text-xs flex-1" style={{ color: 'var(--pink)' }}>
            「{card?.name}」を削除しますか？
          </span>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>はい</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>いいえ</Button>
        </div>
      )}

      <div className="flex gap-6 items-start">
        <form className="flex-1 min-w-0" onSubmit={handleSubmit}>
          <label style={labelStyle}>画像（任意）</label>
          <div className="flex gap-2.5 items-center">
            <button
              type="button"
              style={{ ...inp, width: 'auto', padding: '5px 12px', cursor: 'pointer', color: 'var(--purple-lite)', border: '1px solid rgba(var(--purple-rgb),0.5)' }}
              onClick={() => fileRef.current?.click()}
            >
              ファイルを選択
            </button>
            <span className="font-body text-xs" style={{ color: 'var(--muted)' }}>
              {imageFile ? imageFile.name : (isEdit && card?.image_data ? '登録済み' : '未選択')}
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFile}
          />

          <label style={labelStyle}>カード名 *</label>
          <input
            style={inp}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="カード名"
            autoFocus
          />

          {fieldDefs.map(def => (
            <div key={def.id}>
              <label style={labelStyle}>{def.label}</label>
              {renderField(def)}
            </div>
          ))}

          {!showAddField ? (
            <button
              type="button"
              onClick={() => setShowAddField(true)}
              className="mt-3 font-body text-xs px-2.5 py-1 rounded cursor-pointer transition-all"
              style={{ background: 'transparent', color: 'var(--purple-lite)', border: '1px dashed rgba(var(--purple-rgb),0.5)' }}
            >
              + フィールド追加
            </button>
          ) : (
            <div
              className="mt-3 rounded-lg"
              style={{ padding: '10px 12px', background: 'var(--bg2)', border: '1px solid rgba(var(--purple-rgb),0.4)' }}
            >
              <div className="flex gap-1.5 mb-1.5">
                <input
                  style={{ ...inp, flex: 1 }}
                  type="text"
                  placeholder="ラベル名"
                  value={newFieldLabel}
                  onChange={e => setNewFieldLabel(e.target.value)}
                />
                <select
                  style={{ ...inp, width: 120 }}
                  value={newFieldType}
                  onChange={e => setNewFieldType(e.target.value as NewFieldType)}
                >
                  <option value="text">テキスト</option>
                  <option value="number">数値</option>
                  <option value="select">選択</option>
                  <option value="multi-select">複数選択</option>
                </select>
              </div>
              {(newFieldType === 'select' || newFieldType === 'multi-select') && (
                <input
                  style={{ ...inp, marginBottom: 6 }}
                  type="text"
                  placeholder="選択肢をカンマ区切りで (例: 赤,青,緑)"
                  value={newFieldOptions}
                  onChange={e => setNewFieldOptions(e.target.value)}
                />
              )}
              {addFieldError && <p className="font-body text-xs mb-1.5" style={{ color: 'var(--danger)' }}>{addFieldError}</p>}
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  style={{ background: 'linear-gradient(135deg,#6040cc,#402090)', color: '#fff', border: 'none' }}
                  onClick={handleAddField}
                >
                  追加
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAddField(false); setAddFieldError('') }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="font-body text-xs mt-2.5" style={{ color: 'var(--pink)' }}>{error}</p>
          )}

          <div className="flex gap-2 mt-5">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 font-mono text-[8px] rounded-theme cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait"
              style={{ padding: '10px 0', background: 'linear-gradient(135deg, #00aa88, #006655)', color: '#fff', border: 'none' }}
            >
              {saving ? '保存中...' : (isEdit ? '更新' : '追加')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-mono text-[8px] rounded-theme cursor-pointer transition-all"
              style={{ padding: '10px 0', background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              キャンセル
            </button>
          </div>
        </form>

        {/* 右カラム: 画像プレビュー */}
        <div
          onClick={() => fileRef.current?.click()}
          className="rounded-lg overflow-hidden cursor-pointer flex items-center justify-center transition-shadow duration-200"
          style={{
            width: 280,
            flexShrink: 0,
            aspectRatio: '150/210',
            border: preview ? '1px solid rgba(var(--purple-rgb),0.5)' : '2px dashed rgba(var(--purple-rgb),0.3)',
            background: 'var(--bg2)',
            boxShadow: preview ? '0 0 30px rgba(var(--cyan-rgb),0.2)' : 'none',
            alignSelf: 'flex-start',
            marginTop: 14,
          }}
        >
          {preview
            ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <span className="font-body text-[10px] text-center p-2.5 leading-relaxed" style={{ color: 'var(--surface2)' }}>
                クリックして<br />画像を選択
              </span>
          }
        </div>
      </div>
    </Dialog>
  )
}
