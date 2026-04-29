import { useState } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import type { FieldDef, GameProfile, GameConfigJson } from '../../domain/types'
import defaultBoardConfig from '../../assets/gameConfig.json'
import { BoardEditorDialog } from './BoardEditorDialog'
import { FieldCard, labelToId, ensureUniqueId } from './fieldDefShared'
import { useSkin } from '../skin/SkinContext'

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

const STEPS = ['基本情報', 'カード属性', 'ボード配置']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex mb-6 mt-1">
      {STEPS.map((label, i) => {
        const active = i === current
        const done = i < current
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center w-full">
              <div style={{ flex: 1, height: 2, background: i === 0 ? 'transparent' : (done || active ? 'var(--cyan)' : 'var(--surface2)') }} />
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                background: done ? 'var(--cyan)' : (active ? 'rgba(var(--cyan-rgb),0.3)' : 'var(--surface2)'),
                border: `2px solid ${done || active ? 'var(--cyan)' : 'var(--border)'}`,
                color: done || active ? 'var(--bg)' : 'var(--muted)',
                flexShrink: 0,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1, height: 2, background: i === STEPS.length - 1 ? 'transparent' : (done ? 'var(--cyan)' : 'var(--surface2)') }} />
            </div>
            <span
              className="text-[9px] font-body"
              style={{ color: active ? 'var(--cyan)' : (done ? 'var(--cyan)' : 'var(--muted)') }}
            >
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
  const { Button, Dialog, Input } = useSkin()
  const { activeDialog, closeDialog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
  }))

  const [gameName, setGameName] = useState('')
  const [maxDeckSize, setMaxDeckSize] = useState('')
  const [maxCopies, setMaxCopies] = useState('')
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([])
  const [boardConfig, setBoardConfig] = useState<GameConfigJson>(defaultBoardConfig as GameConfigJson)
  const [showBoardEditor, setShowBoardEditor] = useState(false)
  const [step, setStep] = useState(0)
  const [nameError, setNameError] = useState('')

  if (activeDialog !== 'setup-wizard') return null

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

  function handleBoardEditorSave(config: GameConfigJson) {
    setBoardConfig(config)
    setShowBoardEditor(false)
    handleComplete(config)
  }

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
    <Dialog open={true} onClose={closeDialog} title="NEW GAME SETUP" width="max-w-[560px]" className="flex flex-col font-body">
      <StepIndicator current={step} />

        {/* ──────── Step 0: 基本情報 ──────── */}
        {step === 0 && (
          <div className="flex flex-col gap-1">
            <p className="font-body text-xs mb-4" style={{ color: 'var(--muted)' }}>
              新しいゲームの基本情報を設定します。
            </p>

            <Input
              label="ゲーム名 *"
              type="text"
              value={gameName}
              onChange={e => { setGameName(e.target.value); if (nameError) setNameError('') }}
              placeholder="例: デュエルマスターズ"
              autoFocus
              error={nameError || undefined}
            />

            <div className="mt-2">
              <Input
                label="最大デッキ枚数（任意）"
                type="number"
                min={1}
                value={maxDeckSize}
                onChange={e => setMaxDeckSize(e.target.value)}
                placeholder="例: 40（空=制限なし）"
                className="w-40"
              />
            </div>

            <div className="mt-2">
              <Input
                label="同名カード最大枚数（任意）"
                type="number"
                min={1}
                value={maxCopies}
                onChange={e => setMaxCopies(e.target.value)}
                placeholder="例: 4（空=制限なし）"
                className="w-40"
              />
            </div>
          </div>
        )}

        {/* ──────── Step 1: カード属性定義 ──────── */}
        {step === 1 && (
          <div>
            <p className="font-body text-xs mb-3" style={{ color: 'var(--muted)' }}>
              カードが持つ属性を定義します。（後から変更可能）
            </p>

            <div className="mb-3.5">
              <div className="font-body text-[10px] mb-1.5" style={{ color: 'var(--muted)' }}>よく使うフィールド:</div>
              <div className="flex flex-wrap gap-1.5">
                {FIELD_PRESETS.map(preset => {
                  const used = fieldDefs.some(f => f.id === preset.id)
                  return (
                    <button
                      key={preset.id}
                      onClick={() => addPreset(preset)}
                      disabled={used}
                      className="font-body text-xs px-2.5 py-1 rounded cursor-pointer disabled:opacity-40 disabled:cursor-default transition-all"
                      style={{
                        border: '1px solid rgba(var(--purple-rgb),0.3)',
                        background: used ? 'transparent' : 'rgba(var(--purple-rgb),0.1)',
                        color: used ? 'var(--surface2)' : 'var(--purple-lite)',
                      }}
                    >
                      {used ? '✓ ' : '+ '}{preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {fieldDefs.length > 0 ? (
              <div className="flex flex-col gap-2 mb-3">
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
              <div className="py-4 text-center font-body text-xs mb-3" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                プリセットか「＋ 追加」から始めてください
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              style={{ background: 'rgba(var(--cyan-rgb),0.08)', color: 'var(--cyan)', border: '1px solid rgba(var(--cyan-rgb),0.3)' }}
              onClick={addField}
            >
              ＋ フィールドを追加
            </Button>
          </div>
        )}

        {/* ──────── Step 2: ボード配置 ──────── */}
        {step === 2 && (
          <div>
            <p className="font-body text-xs mb-4" style={{ color: 'var(--muted)' }}>
              ゲームボードのゾーン配置を設定します。
            </p>

            <div
              className="rounded-lg p-4 mb-4"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              <div className="font-body text-xs mb-2.5" style={{ color: 'var(--muted)' }}>
                現在の設定: {boardConfig.windows.length} ウィンドウ / {boardConfig.zones.length} ゾーン
              </div>
              <div className="flex flex-wrap gap-1.5">
                {boardConfig.zones.slice(0, 6).map(z => (
                  <span
                    key={z.id}
                    className="font-body text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: z.visibility === 'public' ? 'rgba(59,130,246,0.15)' : 'rgba(var(--purple-rgb),0.15)',
                      color: z.visibility === 'public' ? '#60a5fa' : 'var(--purple-lite)',
                      border: `1px solid ${z.visibility === 'public' ? 'rgba(59,130,246,0.3)' : 'rgba(var(--purple-rgb),0.3)'}`,
                    }}
                  >
                    {z.visibility === 'public' ? '●' : '◆'} {z.name}
                  </span>
                ))}
                {boardConfig.zones.length > 6 && (
                  <span className="font-body text-[10px]" style={{ color: 'var(--muted)' }}>
                    +{boardConfig.zones.length - 6}...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ボタン行 */}
        <div className="flex gap-2 mt-6 justify-end">
          {step > 0 && (
            <Button variant="secondary" onClick={handleBack}>戻る</Button>
          )}

          {step < 2 && (
            <Button variant="primary" onClick={handleNext}>次へ</Button>
          )}

          {step === 2 && (
            <>
              <Button variant="secondary" onClick={() => handleComplete()}>後で設定する</Button>
              <Button
                variant="primary"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)', color: '#fff', border: 'none' }}
                onClick={() => setShowBoardEditor(true)}
              >
                ボード編集
              </Button>
              <Button variant="primary" onClick={() => handleComplete()}>完了</Button>
            </>
          )}
        </div>
    </Dialog>
  )
}
