import { useState } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import type { FieldDef, GameProfile, GameConfigJson } from '../../domain/types'
import defaultBoardConfig from '../../assets/gameConfig.json'
import { BoardEditorDialog } from './BoardEditorDialog'

// ──────────────────────────────────────────────
// スタイル定数
// ──────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
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
  width: 560,
  maxHeight: '88vh',
  overflowY: 'auto',
  boxShadow: '0 0 60px rgba(0,200,150,0.15)',
  fontFamily: "'Chakra Petch', sans-serif",
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
}

const titleStyle: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 11,
  color: '#00FFD0',
  textShadow: '0 0 16px rgba(0,255,200,0.6)',
  margin: 0,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#94A3B8',
  fontSize: 11,
  marginBottom: 4,
  marginTop: 14,
}

const inputStyle: React.CSSProperties = {
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

const primaryBtn: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 8,
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #00aa88, #006655)',
  color: '#fff',
  border: 'none',
}

const secondaryBtn: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 8,
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  background: 'transparent',
  color: '#505c78',
  border: '1px solid rgba(255,255,255,0.1)',
}

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
// ユーティリティ
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

// ──────────────────────────────────────────────
// プリセット
// ──────────────────────────────────────────────
const FIELD_PRESETS: FieldDef[] = [
  { id: 'cost',      label: 'コスト',     type: 'number',       sortable: true,  filterable: false },
  { id: 'power',     label: 'パワー',     type: 'number',       sortable: true,  filterable: false },
  { id: 'card_type', label: 'カード種類', type: 'select',       options: ['クリーチャー', '呪文', 'フィールド'], filterable: true },
  { id: 'attribute', label: '属性',       type: 'multi-select', options: ['火', '水', '自然', '光', '闇'], filterable: true },
  { id: 'rarity',    label: 'レアリティ', type: 'select',       options: ['C', 'U', 'R', 'VR', 'SR'], filterable: true },
  { id: 'set',       label: 'セット',     type: 'text',         filterable: true },
]

// ──────────────────────────────────────────────
// ステップインジケーター
// ──────────────────────────────────────────────
const STEPS = ['基本情報', 'カード属性', 'ボード配置']

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 24, marginTop: 4 }}>
      {STEPS.map((label, i) => {
        const active = i === current
        const done = i < current
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {/* connector line */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1, height: 2, background: i === 0 ? 'transparent' : (done || active ? '#00aa88' : '#1e2540') }} />
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                background: done ? '#00aa88' : (active ? '#006655' : '#0a0e1a'),
                border: `2px solid ${done || active ? '#00aa88' : '#1e2540'}`,
                color: done || active ? '#fff' : '#505c78',
                flexShrink: 0,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1, height: 2, background: i === STEPS.length - 1 ? 'transparent' : (done ? '#00aa88' : '#1e2540') }} />
            </div>
            <span style={{ fontSize: 9, color: active ? '#00FFD0' : (done ? '#00aa88' : '#505c78'), fontFamily: "'Chakra Petch', sans-serif" }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────
// FieldDef カードコンポーネント
// ──────────────────────────────────────────────
const TYPE_OPTIONS: { value: FieldDef['type']; label: string }[] = [
  { value: 'text',         label: 'テキスト' },
  { value: 'number',       label: '数値' },
  { value: 'select',       label: '選択肢（一つ）' },
  { value: 'multi-select', label: '複数選択' },
]

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
      {/* 上段: 表示名 + 削除 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          style={{ ...cellInput, flex: 1, fontSize: 13 }}
          value={field.label}
          onChange={e => handleLabelChange(e.target.value)}
          placeholder="表示名（例: マナコスト）"
        />
        <button style={dangerBtn} onClick={onDelete}>×</button>
      </div>

      {/* 種類ボタン */}
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

      {/* タグ入力（select/multi-select） */}
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
                <span
                  onClick={() => removeOption(opt)}
                  style={{ cursor: 'pointer', color: '#7c3aed', fontSize: 12, lineHeight: 1 }}
                >×</span>
              </span>
            ))}
          </div>
          <input
            style={{ ...cellInput, width: 180 }}
            value={optionInput}
            onChange={e => setOptionInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addOption(optionInput)
              }
            }}
            onBlur={() => addOption(optionInput)}
            placeholder="Enterで追加"
          />
        </div>
      )}

      {/* 詳細設定（折りたたみ） */}
      <div>
        <button
          onClick={() => setShowAdvanced(s => !s)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#505c78',
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: "'Chakra Petch', sans-serif",
            padding: 0,
          }}
        >
          {showAdvanced ? '▼' : '▶'} 詳細設定
        </button>
        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingLeft: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: '#94A3B8', fontFamily: "'Chakra Petch', sans-serif" }}>
              <input
                type="checkbox"
                style={{ accentColor: '#A78BFA', cursor: 'pointer' }}
                checked={!!field.sortable}
                onChange={e => onChange({ ...field, sortable: e.target.checked })}
              />
              並び替えを有効にする（デッキのソート選択肢に表示）
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: '#94A3B8', fontFamily: "'Chakra Petch', sans-serif" }}>
              <input
                type="checkbox"
                style={{ accentColor: '#A78BFA', cursor: 'pointer' }}
                checked={!!field.filterable}
                onChange={e => onChange({ ...field, filterable: e.target.checked })}
              />
              絞り込みを有効にする（デッキのフィルター欄に表示）
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// ウィザード本体
// ──────────────────────────────────────────────
export function GameSetupWizard() {
  const { activeDialog, closeDialog, openDialog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    openDialog: s.openDialog,
  }))

  // ステップ①: 基本情報
  const [gameName, setGameName] = useState('')
  const [maxDeckSize, setMaxDeckSize] = useState('')
  const [maxCopies, setMaxCopies] = useState('')

  // ステップ②: フィールド定義
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([])

  // ステップ③: ボード設定
  const [boardConfig, setBoardConfig] = useState<GameConfigJson>(defaultBoardConfig as GameConfigJson)
  const [showBoardEditor, setShowBoardEditor] = useState(false)

  // 現在のステップ
  const [step, setStep] = useState(0)
  const [nameError, setNameError] = useState('')

  if (activeDialog !== 'setup-wizard') return null

  // ──────────────────────────────────────────────
  // ナビゲーション
  // ──────────────────────────────────────────────
  function handleNext() {
    if (step === 0) {
      if (!gameName.trim()) {
        setNameError('ゲーム名を入力してください')
        return
      }
      setNameError('')
    }
    setStep(s => s + 1)
  }

  function handleBack() {
    setStep(s => s - 1)
  }

  // ──────────────────────────────────────────────
  // フィールド操作
  // ──────────────────────────────────────────────
  function addField() {
    const newField: FieldDef = {
      id: ensureUniqueId('field', fieldDefs.map(f => f.id)),
      label: '',
      type: 'text',
      sortable: false,
      filterable: false,
    }
    setFieldDefs(prev => [...prev, newField])
  }

  function addPreset(preset: FieldDef) {
    if (fieldDefs.some(f => f.id === preset.id)) return
    setFieldDefs(prev => [...prev, { ...preset }])
  }

  function updateField(index: number, field: FieldDef) {
    setFieldDefs(prev => prev.map((f, i) => i === index ? field : f))
  }

  function deleteField(index: number) {
    setFieldDefs(prev => prev.filter((_, i) => i !== index))
  }

  // ──────────────────────────────────────────────
  // 完了処理
  // ──────────────────────────────────────────────
  function handleComplete(config: GameConfigJson = boardConfig) {
    const profile: GameProfile = {
      meta: { name: gameName.trim() },
      fieldDefs,
      deckRules: {
        ...(maxDeckSize ? { maxDeckSize: Number(maxDeckSize) } : {}),
        ...(maxCopies ? { maxCopies: Number(maxCopies) } : {}),
      },
      boardConfig: config,
      pool: [],
      decks: [],
    }
    useLibraryStore.getState().applyLibrarySnapshot([], [], -1, profile.fieldDefs, profile.deckRules, profile.boardConfig, gameName.trim())
    useLayoutStore.getState().setConfig(profile.boardConfig)
    useLibraryStore.getState().exportGameProfile()
    closeDialog()
  }

  function handleOpenBoardEditor() {
    setShowBoardEditor(true)
  }

  function handleBoardEditorSave(config: GameConfigJson) {
    setBoardConfig(config)
    setShowBoardEditor(false)
    handleComplete(config)
  }

  // ──────────────────────────────────────────────
  // レンダリング
  // ──────────────────────────────────────────────
  if (showBoardEditor) {
    return (
      <BoardEditorDialog
        initialConfig={boardConfig}
        onSave={handleBoardEditorSave}
        onClose={() => setShowBoardEditor(false)}
      />
    )
  }

  return (
    <div style={overlay}>
      <div style={dialog} onClick={e => e.stopPropagation()}>
        {/* タイトル */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={titleStyle}>NEW GAME SETUP</h2>
          <button
            onClick={closeDialog}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#505c78',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}
            aria-label="閉じる"
          >×</button>
        </div>

        {/* ステップインジケーター */}
        <StepIndicator current={step} />

        {/* ──────── Step 0: 基本情報 ──────── */}
        {step === 0 && (
          <div>
            <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 16, marginTop: 0 }}>
              新しいゲームの基本情報を設定します。
            </p>

            <label style={labelStyle}>ゲーム名 *</label>
            <input
              style={{ ...inputStyle, borderColor: nameError ? 'rgba(220,60,60,0.6)' : 'rgba(124,58,237,0.4)' }}
              type="text"
              value={gameName}
              onChange={e => { setGameName(e.target.value); if (nameError) setNameError('') }}
              placeholder="例: デュエルマスターズ"
              autoFocus
            />
            {nameError && (
              <p style={{ color: '#ff6666', fontSize: 11, marginTop: 4, marginBottom: 0 }}>{nameError}</p>
            )}

            <label style={labelStyle}>最大デッキ枚数（任意）</label>
            <input
              style={{ ...inputStyle, width: 160 }}
              type="number"
              min={1}
              value={maxDeckSize}
              onChange={e => setMaxDeckSize(e.target.value)}
              placeholder="例: 40（空=制限なし）"
            />

            <label style={labelStyle}>同名カード最大枚数（任意）</label>
            <input
              style={{ ...inputStyle, width: 160 }}
              type="number"
              min={1}
              value={maxCopies}
              onChange={e => setMaxCopies(e.target.value)}
              placeholder="例: 4（空=制限なし）"
            />
          </div>
        )}

        {/* ──────── Step 1: カード属性定義 ──────── */}
        {step === 1 && (
          <div>
            <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12, marginTop: 0 }}>
              カードが持つ属性を定義します。（後から変更可能）
            </p>

            {/* プリセット */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#505c78', fontFamily: "'Chakra Petch', sans-serif", marginBottom: 6 }}>
                よく使うフィールド:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {FIELD_PRESETS.map(preset => {
                  const used = fieldDefs.some(f => f.id === preset.id)
                  return (
                    <button
                      key={preset.id}
                      onClick={() => addPreset(preset)}
                      disabled={used}
                      style={{
                        fontFamily: "'Chakra Petch', sans-serif",
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 4,
                        cursor: used ? 'default' : 'pointer',
                        border: '1px solid rgba(124,58,237,0.3)',
                        background: used ? 'transparent' : 'rgba(124,58,237,0.1)',
                        color: used ? '#334' : '#A78BFA',
                        opacity: used ? 0.4 : 1,
                      }}
                    >
                      {used ? '✓ ' : '+ '}{preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* フィールドカード一覧 */}
            {fieldDefs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {fieldDefs.map((f, i) => (
                  <FieldCard
                    key={f.id}
                    field={f}
                    onChange={field => updateField(i, field)}
                    onDelete={() => deleteField(i)}
                    allIds={fieldDefs.map(fd => fd.id).filter(id => id !== f.id)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#334', fontFamily: "'Chakra Petch', sans-serif", fontSize: 12, marginBottom: 12 }}>
                プリセットか「＋ 追加」から始めてください
              </div>
            )}

            <button style={addBtn} onClick={addField}>
              ＋ フィールドを追加
            </button>
          </div>
        )}

        {/* ──────── Step 2: ボード配置 ──────── */}
        {step === 2 && (
          <div>
            <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 16, marginTop: 0 }}>
              ゲームボードのゾーン配置を設定します。
            </p>

            <div style={{
              background: '#090c1c',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 8,
              padding: '16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10, fontFamily: "'Chakra Petch', sans-serif" }}>
                現在の設定: {boardConfig.windows.length} ウィンドウ / {boardConfig.zones.length} ゾーン
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                {boardConfig.zones.slice(0, 6).map(z => (
                  <span key={z.id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: z.visibility === 'public' ? 'rgba(59,130,246,0.15)' : 'rgba(124,58,237,0.15)', color: z.visibility === 'public' ? '#60a5fa' : '#A78BFA', border: `1px solid ${z.visibility === 'public' ? 'rgba(59,130,246,0.3)' : 'rgba(124,58,237,0.3)'}` }}>
                    {z.visibility === 'public' ? '●' : '◆'} {z.name}
                  </span>
                ))}
                {boardConfig.zones.length > 6 && (
                  <span style={{ fontSize: 10, color: '#505c78' }}>+{boardConfig.zones.length - 6}...</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ボタン行 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
          {step > 0 && (
            <button style={secondaryBtn} onClick={handleBack}>
              戻る
            </button>
          )}

          {step < 2 && (
            <button style={primaryBtn} onClick={handleNext}>
              次へ
            </button>
          )}

          {step === 2 && (
            <>
              <button style={secondaryBtn} onClick={() => handleComplete()}>
                後で設定する
              </button>
              <button
                style={{ ...primaryBtn, background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}
                onClick={handleOpenBoardEditor}
              >
                ボード編集
              </button>
              <button
                style={{ ...primaryBtn, background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
                onClick={() => handleComplete()}
              >
                完了
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
