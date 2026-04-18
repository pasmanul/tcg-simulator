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
// FieldDef 編集行
// ──────────────────────────────────────────────
interface FieldRowProps {
  field: FieldDef
  onChange: (field: FieldDef) => void
  onDelete: () => void
}

function FieldRow({ field, onChange, onDelete }: FieldRowProps) {
  const needsOptions = field.type === 'select' || field.type === 'multi-select'
  const tdStyle: React.CSSProperties = { padding: '4px 4px', verticalAlign: 'middle' }
  const cellInput: React.CSSProperties = {
    width: '100%',
    background: '#0a0e1a',
    color: '#E2E8F0',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 3,
    padding: '4px 6px',
    fontFamily: "'Chakra Petch', sans-serif",
    fontSize: 11,
    boxSizing: 'border-box',
  }
  const checkStyle: React.CSSProperties = { accentColor: '#A78BFA', cursor: 'pointer' }

  return (
    <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
      <td style={tdStyle}>
        <input
          style={cellInput}
          value={field.id}
          onChange={e => onChange({ ...field, id: e.target.value })}
          placeholder="id"
        />
      </td>
      <td style={tdStyle}>
        <input
          style={cellInput}
          value={field.label}
          onChange={e => onChange({ ...field, label: e.target.value })}
          placeholder="表示名"
        />
      </td>
      <td style={tdStyle}>
        <select
          style={{ ...cellInput, cursor: 'pointer' }}
          value={field.type}
          onChange={e => onChange({ ...field, type: e.target.value as FieldDef['type'] })}
        >
          <option value="text">text</option>
          <option value="number">number</option>
          <option value="select">select</option>
          <option value="multi-select">multi-select</option>
        </select>
      </td>
      <td style={tdStyle}>
        {needsOptions ? (
          <input
            style={cellInput}
            value={field.options?.join(',') ?? ''}
            onChange={e => onChange({ ...field, options: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })}
            placeholder="A,B,C"
          />
        ) : (
          <span style={{ color: '#334', fontSize: 10, fontFamily: "'Chakra Petch', sans-serif" }}>—</span>
        )}
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <input
          type="checkbox"
          style={checkStyle}
          checked={!!field.sortable}
          onChange={e => onChange({ ...field, sortable: e.target.checked })}
        />
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <input
          type="checkbox"
          style={checkStyle}
          checked={!!field.filterable}
          onChange={e => onChange({ ...field, filterable: e.target.checked })}
        />
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <button style={dangerBtn} onClick={onDelete}>削除</button>
      </td>
    </tr>
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
      id: `field${fieldDefs.length + 1}`,
      label: `フィールド${fieldDefs.length + 1}`,
      type: 'text',
      sortable: false,
      filterable: false,
    }
    setFieldDefs(prev => [...prev, newField])
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
    useLibraryStore.getState().applyLibrarySnapshot([], [], -1, profile.fieldDefs, profile.deckRules, profile.boardConfig)
    useLayoutStore.getState().setConfig(profile.boardConfig)
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
            <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 16, marginTop: 0 }}>
              カードが持つ属性フィールドを定義します。（後から変更可能）
            </p>

            {fieldDefs.length > 0 ? (
              <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                      {(['id', 'label', 'type', 'options', 'sort', 'filter', ''] as const).map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: '4px 4px 8px',
                            color: '#505c78',
                            fontWeight: 'normal',
                            fontFamily: "'Chakra Petch', sans-serif",
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fieldDefs.map((f, i) => (
                      <FieldRow
                        key={i}
                        field={f}
                        onChange={field => updateField(i, field)}
                        onDelete={() => deleteField(i)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                padding: '20px 0',
                textAlign: 'center',
                color: '#334',
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: 12,
                marginBottom: 12,
              }}>
                フィールドが未設定です。カード属性が不要な場合はそのまま進んでください。
              </div>
            )}

            <button style={addBtn} onClick={addField}>
              + フィールドを追加
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
