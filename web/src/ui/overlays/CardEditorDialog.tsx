import { useState, useRef, useEffect } from 'react'
import { useLibraryStore } from '../../store/libraryStore'

const CIVILIZATIONS = ['光', '水', '闇', '火', '自然', '無色']
const CARD_TYPES = ['クリーチャー', '呪文', 'タマシード', '進化クリーチャー', 'フィールド', 'その他']

interface Props {
  onClose: () => void
}

export function CardEditorDialog({ onClose }: Props) {
  const { dirHandle, addCard } = useLibraryStore(s => ({
    dirHandle: s.dirHandle,
    addCard: s.addCard,
  }))

  const [name, setName] = useState('')
  const [mana, setMana] = useState(1)
  const [civs, setCivs] = useState<string[]>(['光'])
  const [cardType, setCardType] = useState('クリーチャー')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleCiv(civ: string) {
    setCivs(prev =>
      prev.includes(civ) ? prev.filter(c => c !== civ) : [...prev, civ]
    )
  }

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('カード名を入力してください'); return }
    if (civs.length === 0) { setError('文明を1つ以上選択してください'); return }
    if (!dirHandle) { setError('先にカードライブラリを読み込んでください'); return }
    setSaving(true)
    setError('')
    try {
      await addCard({ name: name.trim(), mana, civilizations: civs, card_type: cardType }, imageFile ?? undefined)
      onClose()
    } catch {
      setError('保存に失敗しました')
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
        <h2 style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 11,
          color: '#00FFD0',
          textShadow: '0 0 16px rgba(0,255,200,0.6)',
          marginBottom: 4,
        }}>
          ADD CARD
        </h2>

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
              {imageFile ? imageFile.name : '未選択'}
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
              {saving ? '保存中...' : '追加'}
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
