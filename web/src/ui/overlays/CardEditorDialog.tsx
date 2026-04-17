import { useState, useRef, useEffect } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import type { Card } from '../../domain/types'

const CIVILIZATIONS = ['光', '水', '闇', '火', '自然', '無色']
const CARD_TYPES = ['クリーチャー', '呪文', 'タマシード', '進化クリーチャー', 'フィールド', 'その他']

interface Props {
  onClose: () => void
  card?: Card  // 編集モード時に渡す
}

export function CardEditorDialog({ onClose, card }: Props) {
  const { dirHandle, addCard, updateCard, deleteCard } = useLibraryStore(s => ({
    dirHandle: s.dirHandle,
    addCard: s.addCard,
    updateCard: s.updateCard,
    deleteCard: s.deleteCard,
  }))

  const isEdit = !!card

  const [name, setName] = useState(card?.name ?? '')
  const [mana, setMana] = useState(card?.mana ?? 1)
  const [civs, setCivs] = useState<string[]>(card?.civilizations ?? ['光'])
  const [cardType, setCardType] = useState(card?.card_type ?? 'クリーチャー')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(card?.image_data ?? null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleCiv(civ: string) {
    setCivs(prev =>
      prev.includes(civ) ? prev.filter(c => c !== civ) : [...prev, civ]
    )
  }

  useEffect(() => {
    // image_data以外のblobURLのみrevoke
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
    if (civs.length === 0) { setError('文明を1つ以上選択してください'); return }
    if (!dirHandle) { setError('先にカードライブラリを読み込んでください'); return }
    setSaving(true)
    setError('')
    try {
      if (isEdit && card) {
        await updateCard(card.id, { name: name.trim(), mana, civilizations: civs, card_type: cardType }, imageFile ?? undefined)
      } else {
        await addCard({ name: name.trim(), mana, civilizations: civs, card_type: cardType }, imageFile ?? undefined)
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
    width: 420,
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

        <form onSubmit={handleSubmit}>
          <label style={label}>カード名 *</label>
          <input
            style={inp}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="カード名"
            autoFocus
          />

          <label style={label}>マナコスト *</label>
          <input
            style={{ ...inp, width: 80 }}
            type="number"
            min={1}
            max={15}
            value={mana}
            onChange={e => setMana(Number(e.target.value))}
          />

          <label style={label}>文明 *（1つ以上）</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CIVILIZATIONS.map(civ => {
              const active = civs.includes(civ)
              const colors: Record<string, string> = {
                '光': '#ffe44d', '水': '#44aaff', '闇': '#aa44ff',
                '火': '#ff4444', '自然': '#44cc44', '無色': '#888888',
              }
              return (
                <label
                  key={civ}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    color: active ? colors[civ] : '#444',
                    fontSize: 12,
                    userSelect: 'none',
                    transition: 'color 100ms',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleCiv(civ)}
                    style={{ accentColor: colors[civ] }}
                  />
                  {civ}
                </label>
              )
            })}
          </div>

          <label style={label}>カードタイプ *</label>
          <select
            style={inp}
            value={cardType}
            onChange={e => setCardType(e.target.value)}
          >
            {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label style={label}>画像（任意）</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
            <span style={{ color: '#505c78', fontSize: 11, lineHeight: '28px' }}>
              {imageFile ? imageFile.name : (isEdit && card?.image_data ? '登録済み' : '未選択')}
            </span>
            {preview && (
              <img
                src={preview}
                style={{ width: 40, aspectRatio: '150/210', objectFit: 'cover', borderRadius: 3 }}
              />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={handleFile}
          />

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
      </div>
    </div>
  )
}
