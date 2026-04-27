import { useState } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import type { FieldDef, GameProfile, GameConfigJson } from '../../domain/types'
import defaultBoardConfig from '../../assets/gameConfig.json'
import { BoardEditorDialog } from './BoardEditorDialog'
import { FieldCard, labelToId, ensureUniqueId } from './fieldDefShared'

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
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 28,
  width: 560,
  maxHeight: '88vh',
  overflowY: 'auto',
  boxShadow: '0 0 60px rgba(var(--cyan-rgb, 0,200,150), 0.15)',
  fontFamily: 'var(--font-body, "Chakra Petch", sans-serif)',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono, "Press Start 2P", monospace)',
  fontSize: 11,
  color: 'var(--cyan)',
  textShadow: '0 0 16px rgba(var(--cyan-rgb, 0,255,200), 0.6)',
  margin: 0,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: 11,
  marginBottom: 4,
  marginTop: 14,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  color: 'var(--text)',
  border: '1px solid rgba(var(--purple-rgb, 124,58,237), 0.4)',
  borderRadius: 4,
  padding: '6px 10px',
  fontFamily: 'var(--font-body, "Chakra Petch", sans-serif)',
  fontSize: 13,
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

const primaryBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono, "Press Start 2P", monospace)',
  fontSize: 8,
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  background: 'var(--purple)',
  color: '#fff',
  border: 'none',
}

const secondaryBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono, "Press Start 2P", monospace)',
  fontSize: 8,
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--muted)',
  border: '1px solid var(--border)',
}

const addBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono, "Press Start 2P", monospace)',
  fontSize: 7,
  padding: '6px 12px',
  borderRadius: 5,
  cursor: 'pointer',
  background: 'rgba(var(--cyan-rgb, 0,200,150), 0.08)',
  color: 'var(--cyan)',
  border: '1px solid rgba(var(--cyan-rgb, 0,200,150), 0.3)',
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
              <div style={{ flex: 1, height: 2, background: i === 0 ? 'transparent' : (done || active ? 'var(--cyan)' : 'var(--surface2)') }} />
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono, "Press Start 2P", monospace)',
                fontSize: 8,
                background: done ? 'var(--cyan)' : (active ? 'rgba(var(--cyan-rgb, 0,200,150), 0.3)' : 'var(--surface2)'),
                border: `2px solid ${done || active ? 'var(--cyan)' : 'var(--border)'}`,
                color: done || active ? 'var(--bg)' : 'var(--muted)',
                flexShrink: 0,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1, height: 2, background: i === STEPS.length - 1 ? 'transparent' : (done ? 'var(--cyan)' : 'var(--surface2)') }} />
            </div>
            <span style={{ fontSize: 9, color: active ? 'var(--cyan)' : (done ? 'var(--cyan)' : 'var(--muted)'), fontFamily: 'var(--font-body, "Chakra Petch", sans-serif)' }}>
              {label}
            </span>
          </div>
        )
      })}
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
              color: 'var(--muted)',
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
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16, marginTop: 0 }}>
              新しいゲームの基本情報を設定します。
            </p>

            <label style={labelStyle}>ゲーム名 *</label>
            <input
              style={{ ...inputStyle, borderColor: nameError ? 'rgba(220,60,60,0.6)' : `rgba(var(--purple-rgb, 124,58,237), 0.4)` }}
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
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12, marginTop: 0 }}>
              カードが持つ属性を定義します。（後から変更可能）
            </p>

            {/* プリセット */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body, "Chakra Petch", sans-serif)', marginBottom: 6 }}>
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
                        border: '1px solid rgba(var(--purple-rgb, 124,58,237), 0.3)',
                        background: used ? 'transparent' : 'rgba(var(--purple-rgb, 124,58,237), 0.1)',
                        color: used ? 'var(--surface2)' : 'var(--purple-lite)',
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
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--muted)', opacity: 0.5, fontFamily: 'var(--font-body, "Chakra Petch", sans-serif)', fontSize: 12, marginBottom: 12 }}>
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
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16, marginTop: 0 }}>
              ゲームボードのゾーン配置を設定します。
            </p>

            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, fontFamily: 'var(--font-body, "Chakra Petch", sans-serif)' }}>
                現在の設定: {boardConfig.windows.length} ウィンドウ / {boardConfig.zones.length} ゾーン
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                {boardConfig.zones.slice(0, 6).map(z => (
                  <span key={z.id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: z.visibility === 'public' ? 'rgba(59,130,246,0.15)' : `rgba(var(--purple-rgb, 124,58,237), 0.15)`, color: z.visibility === 'public' ? '#60a5fa' : 'var(--purple-lite)', border: `1px solid ${z.visibility === 'public' ? 'rgba(59,130,246,0.3)' : `rgba(var(--purple-rgb, 124,58,237), 0.3)`}` }}>
                    {z.visibility === 'public' ? '●' : '◆'} {z.name}
                  </span>
                ))}
                {boardConfig.zones.length > 6 && (
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>+{boardConfig.zones.length - 6}...</span>
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
                style={{ ...primaryBtn, background: 'var(--purple)' }}
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
