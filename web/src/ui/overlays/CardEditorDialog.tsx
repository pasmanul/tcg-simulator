import { useState, useRef, useEffect } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import type { Card, FieldDef } from '../../domain/types'
import { labelToId, ensureUniqueId } from './fieldDefShared'

type NewFieldType = FieldDef['type']

interface Props {
  onClose: () => void
  card?: Card  // 編集モード時に渡す
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

  // 初期値: 編集時は card.fields、新規は fieldDefs の default 値
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

  // 新規フィールド追加UI
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {def.options?.map(o => {
              const cur: string[] = Array.isArray(fieldValues[def.id]) ? fieldValues[def.id] : []
              const active = cur.includes(o)
              return (
                <label
                  key={o}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    color: active ? '#A78BFA' : '#555c78',
                    fontSize: 12,
                    userSelect: 'none',
                    transition: 'color 100ms',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => {
                      const next = e.target.checked ? [...cur, o] : cur.filter(x => x !== o)
                      setField(def.id, next)
                    }}
                    style={{ accentColor: '#A78BFA' }}
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

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  }

  const dialog: React.CSSProperties = {
    background: '#0e1228',
    border: '1px solid rgba(0,255,200,0.3)',
    borderRadius: 16,
    padding: 28,
    width: 800,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 0 60px rgba(0,200,150,0.15)',
    fontFamily: "'Chakra Petch', sans-serif",
  }

  const label: React.CSSProperties = {
    display: 'block',
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
    marginTop: 14,
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: '#0a0e1a',
    color: '#E2E8F0',
    border: '1px solid rgba(124,58,237,0.4)',
    borderRadius: 4,
    padding: '6px 10px',
    fontFamily: "'Chakra Petch', sans-serif",
    fontSize: 13,
    boxSizing: 'border-box',
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={dialog} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 11,
            color: '#00FFD0',
            textShadow: '0 0 16px rgba(0,255,200,0.6)',
          }}>
            {isEdit ? 'EDIT CARD' : 'ADD CARD'}
          </h2>
          {isEdit && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7,
                padding: '5px 10px',
                borderRadius: 5,
                cursor: 'pointer',
                background: '#200c0c',
                color: '#dd6666',
                border: '1px solid #502828',
              }}
            >削除</button>
          )}
        </div>

        {confirmDelete && (
          <div style={{
            background: '#1a0a0a',
            border: '1px solid #602020',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 12, color: '#ff8888', flex: 1 }}>
              「{card?.name}」を削除しますか？
            </span>
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: '5px 10px', borderRadius: 4, cursor: 'pointer', background: '#2a0a0a', color: '#ff6666', border: '1px solid #602020' }}
            >はい</button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: '5px 10px', borderRadius: 4, cursor: 'pointer', background: '#111', color: '#888', border: '1px solid #333' }}
            >いいえ</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <form style={{ flex: 1, minWidth: 0 }} onSubmit={handleSubmit}>
            <label style={label}>画像（任意）</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                style={{
                  ...inp,
                  width: 'auto',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  color: '#A78BFA',
                  border: '1px solid rgba(124,58,237,0.5)',
                }}
                onClick={() => fileRef.current?.click()}
              >
                ファイルを選択
              </button>
              <span style={{ color: '#505c78', fontSize: 11 }}>
                {imageFile ? imageFile.name : (isEdit && card?.image_data ? '登録済み' : '未選択')}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
              onChange={handleFile}
            />

            <label style={label}>カード名 *</label>
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
                <label style={label}>{def.label}</label>
                {renderField(def)}
              </div>
            ))}

            {/* フィールド追加 */}
            {!showAddField ? (
              <button
                type="button"
                onClick={() => setShowAddField(true)}
                style={{ marginTop: 12, fontFamily: "'Chakra Petch', sans-serif", fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', background: 'transparent', color: '#A78BFA', border: '1px dashed rgba(124,58,237,0.5)' }}
              >+ フィールド追加</button>
            ) : (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#0a0e1a', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 6 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
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
                {addFieldError && <p style={{ color: '#ff6666', fontSize: 11, margin: '0 0 6px' }}>{addFieldError}</p>}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={handleAddField} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: '5px 10px', borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg,#6040cc,#402090)', color: '#fff', border: 'none' }}>追加</button>
                  <button type="button" onClick={() => { setShowAddField(false); setAddFieldError('') }} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, padding: '5px 10px', borderRadius: 4, cursor: 'pointer', background: 'transparent', color: '#555c78', border: '1px solid #333' }}>キャンセル</button>
                </div>
              </div>
            )}

            {error && (
              <p style={{ color: '#ff6666', fontSize: 11, marginTop: 10 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  padding: '10px 0',
                  borderRadius: 6,
                  cursor: saving ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #00aa88, #006655)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {saving ? '保存中...' : (isEdit ? '更新' : '追加')}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  padding: '10px 0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#505c78',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                キャンセル
              </button>
            </div>
          </form>

          {/* 右カラム: 画像プレビュー */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 280,
              flexShrink: 0,
              aspectRatio: '150/210',
              borderRadius: 8,
              border: preview ? '1px solid rgba(124,58,237,0.5)' : '2px dashed rgba(124,58,237,0.3)',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#080c1a',
              boxShadow: preview ? '0 0 30px rgba(0,200,150,0.2)' : 'none',
              transition: 'box-shadow 200ms',
              alignSelf: 'flex-start',
              marginTop: 14,
            }}
          >
            {preview
              ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 10, color: '#3a4060', textAlign: 'center', padding: 10, lineHeight: 1.6 }}>クリックして<br />画像を選択</span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
