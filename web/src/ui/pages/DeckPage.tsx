import { useState } from 'react'
import { DeckHud } from '../deck/DeckHud'
import { FilterBar, DEFAULT_FILTER, type FilterState } from '../deck/FilterBar'
import { LibraryGrid } from '../deck/LibraryGrid'
import { DeckGrid } from '../deck/DeckGrid'
import { GameLoadDialog } from '../overlays/GameLoadDialog'
import { CardEditorDialog } from '../overlays/CardEditorDialog'
import { GameSetupWizard } from '../overlays/GameSetupWizard'
import { useLibraryStore } from '../../store/libraryStore'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../components/Button'
import type { Card } from '../../domain/types'

function DeckPanelHeader() {
  const { activeDeckIndex, currentDeckName, newDeck, renameDeck, deleteDeck, decks, setDeckCardBack } = useLibraryStore(s => ({
    activeDeckIndex: s.activeDeckIndex,
    currentDeckName: s.currentDeckName,
    newDeck: s.newDeck,
    renameDeck: s.renameDeck,
    deleteDeck: s.deleteDeck,
    decks: s.decks,
    setDeckCardBack: s.setDeckCardBack,
  }))

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [addingDeck, setAddingDeck] = useState(false)
  const [newDeckInput, setNewDeckInput] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const hasDeck = activeDeckIndex >= 0
  const deckName = currentDeckName()

  function handleStartRename() {
    setNameInput(deckName)
    setEditingName(true)
  }

  function handleCommitRename() {
    if (nameInput.trim()) renameDeck(nameInput.trim())
    setEditingName(false)
  }

  function handleStartAdd() {
    setNewDeckInput('')
    setAddingDeck(true)
    setConfirmingDelete(false)
  }

  function handleCommitAdd() {
    if (newDeckInput.trim()) newDeck(newDeckInput.trim())
    setAddingDeck(false)
    setNewDeckInput('')
  }

  function handleCancelAdd() {
    setAddingDeck(false)
    setNewDeckInput('')
  }

  function handleCommitDelete() {
    deleteDeck()
    setConfirmingDelete(false)
  }

  const inputCls = 'bg-surface2 text-text-base border border-border rounded-theme px-2 py-1 font-body text-xs focus:outline-none focus:border-primary'

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg2 border-b border-border flex-shrink-0 min-h-[36px]"
      style={{ borderBottomColor: 'rgba(0,255,255,0.15)' }}>

      {hasDeck && !addingDeck && !confirmingDelete && (
        editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={handleCommitRename}
            onKeyDown={e => { if (e.key === 'Enter') handleCommitRename(); if (e.key === 'Escape') setEditingName(false) }}
            className={inputCls}
            style={{ border: '1px solid rgba(0,255,255,0.5)', width: 160 }}
          />
        ) : (
          <span
            title="クリックでリネーム"
            onClick={handleStartRename}
            className="font-body text-[13px] text-accent cursor-text max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap px-1 py-px"
            style={{ borderBottom: '1px dashed rgba(0,255,255,0.3)' }}
          >
            {deckName}
          </span>
        )
      )}

      {!hasDeck && !addingDeck && (
        <span className="font-body text-xs text-muted opacity-30">デッキなし</span>
      )}

      {addingDeck ? (
        <>
          <input
            autoFocus
            value={newDeckInput}
            onChange={e => setNewDeckInput(e.target.value)}
            onBlur={handleCommitAdd}
            onKeyDown={e => { if (e.key === 'Enter') handleCommitAdd(); if (e.key === 'Escape') handleCancelAdd() }}
            placeholder="デッキ名を入力"
            className={inputCls}
            style={{ border: '1px solid rgba(100,220,100,0.5)', width: 140 }}
          />
          <Button size="sm" onMouseDown={e => e.preventDefault()} onClick={handleCommitAdd}>✓</Button>
          <Button size="sm" variant="danger" onMouseDown={e => e.preventDefault()} onClick={handleCancelAdd}>✕</Button>
        </>
      ) : confirmingDelete ? (
        <>
          <span className="font-body text-[11px] text-danger whitespace-nowrap">「{deckName}」削除？</span>
          <Button size="sm" variant="danger" onClick={handleCommitDelete}>はい</Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>いいえ</Button>
        </>
      ) : (
        <>
          <Button size="sm" title="新規デッキ" onClick={handleStartAdd}>+</Button>
          {hasDeck && (
            <Button size="sm" variant="danger" title="デッキを削除" onClick={() => setConfirmingDelete(true)}>×</Button>
          )}
        </>
      )}

      {hasDeck && (
        <label title="デッキ裏面画像を設定" className="ml-auto flex items-center gap-1.5 cursor-pointer">
          {decks[activeDeckIndex]?.cardBack && (
            <img
              src={decks[activeDeckIndex].cardBack}
              alt="card back"
              className="h-[22px] rounded object-cover border border-border"
              style={{ aspectRatio: '150/210' }}
            />
          )}
          <span className="font-mono text-[7px] px-2 py-1 rounded-theme text-primary-lite border border-border whitespace-nowrap"
            style={{ background: 'rgba(124,58,237,0.15)' }}>
            BACK IMG
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => setDeckCardBack(reader.result as string)
              reader.readAsDataURL(file)
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}

export function DeckPage() {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [cardEditorOpen, setCardEditorOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const allCards = useLibraryStore(s => s.cards)
  const { currentDeckFn, loadDeck } = useLibraryStore(s => ({ currentDeckFn: s.currentDeck, loadDeck: s.loadDeck }))
  const { profileName, exportGameProfile } = useLibraryStore(s => ({ profileName: s.profileName, exportGameProfile: s.exportGameProfile }))

  function handleDeckCardDrop(cardId: string) {
    const deck = currentDeckFn()
    const entry = deck.find(e => e.cardId === cardId)
    if (!entry) return
    const next = entry.count > 1
      ? deck.map(e => e.cardId === cardId ? { ...e, count: e.count - 1 } : e)
      : deck.filter(e => e.cardId !== cardId)
    loadDeck(next)
  }

  const openSetup = useUIStore(s => s.openDialog)

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-bg text-text-base font-body">

      {/* プロファイル情報バー */}
      <div className="flex items-center gap-2.5 px-3.5 py-1 bg-bg2 border-b border-border flex-shrink-0 min-h-[30px]"
        style={{ borderBottomColor: 'rgba(124,58,237,0.12)' }}>
        <span className="font-mono text-[7px] text-muted">GAME:</span>
        <span className={`font-body text-xs flex-1 ${profileName ? 'text-primary-lite' : 'text-muted italic opacity-40'}`}>
          {profileName || '未ロード'}
        </span>
        <Button size="sm" onClick={() => openSetup('setup')}>ロード</Button>
        {profileName && (
          <Button size="sm" onClick={exportGameProfile}>エクスポート</Button>
        )}
      </div>

      <DeckHud />

      <div className="flex-1 flex overflow-hidden">
        {/* 左パネル: カードプール */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
          <FilterBar cards={allCards} filter={filter} onChange={setFilter} onAddCard={() => setCardEditorOpen(true)} />
          <LibraryGrid filter={filter} onEditCard={card => setEditingCard(card)} onDeckCardDrop={handleDeckCardDrop} />
        </div>

        {/* 右パネル: デッキ内容 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DeckPanelHeader />
          <DeckGrid selectedCardId={selectedCardId} onSelect={setSelectedCardId} />
        </div>
      </div>

      <GameLoadDialog />
      <GameSetupWizard />
      {cardEditorOpen && <CardEditorDialog onClose={() => setCardEditorOpen(false)} />}
      {editingCard && <CardEditorDialog card={editingCard} onClose={() => setEditingCard(null)} />}
    </div>
  )
}
