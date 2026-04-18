import { useState } from 'react'
import { DeckHud } from '../deck/DeckHud'
import { FilterBar, DEFAULT_FILTER, type FilterState } from '../deck/FilterBar'
import { LibraryGrid } from '../deck/LibraryGrid'
import { DeckGrid } from '../deck/DeckGrid'
import { GameLoadDialog } from '../overlays/GameLoadDialog'
import { CardEditorDialog } from '../overlays/CardEditorDialog'
import { useLibraryStore } from '../../store/libraryStore'
import { CRT_STYLE, PAGE_STYLE } from '../pageLayout'
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

  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: '5px 10px',
    borderRadius: 5,
    cursor: 'pointer',
    transition: 'all 150ms',
    whiteSpace: 'nowrap',
  }

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

  const inputStyle: React.CSSProperties = {
    background: '#0a0e1a',
    color: '#E2E8F0',
    borderRadius: 4,
    padding: '4px 8px',
    fontFamily: "'Chakra Petch', sans-serif",
    fontSize: 12,
  }

  return (
    <div style={{
      padding: '6px 12px',
      background: '#060810',
      borderBottom: '1px solid rgba(0,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
      minHeight: 36,
    }}>
      {/* デッキ名 */}
      {hasDeck && !addingDeck && !confirmingDelete && (
        editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={handleCommitRename}
            onKeyDown={e => { if (e.key === 'Enter') handleCommitRename(); if (e.key === 'Escape') setEditingName(false) }}
            style={{ ...inputStyle, border: '1px solid rgba(0,255,255,0.5)', width: 160 }}
          />
        ) : (
          <span
            title="クリックでリネーム"
            onClick={handleStartRename}
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: 13,
              color: '#00FFFF',
              cursor: 'text',
              borderBottom: '1px dashed rgba(0,255,255,0.3)',
              padding: '1px 4px',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {deckName}
          </span>
        )
      )}

      {!hasDeck && !addingDeck && (
        <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 12, color: '#334' }}>
          デッキなし
        </span>
      )}

      {/* 新規追加UI */}
      {addingDeck ? (
        <>
          <input
            autoFocus
            value={newDeckInput}
            onChange={e => setNewDeckInput(e.target.value)}
            onBlur={handleCommitAdd}
            onKeyDown={e => { if (e.key === 'Enter') handleCommitAdd(); if (e.key === 'Escape') handleCancelAdd() }}
            placeholder="デッキ名を入力"
            style={{ ...inputStyle, border: '1px solid rgba(100,220,100,0.5)', width: 140 }}
          />
          <button
            style={{ ...btn, background: '#0a1a0a', color: '#66dd66', border: '1px solid #204020' }}
            onMouseDown={e => e.preventDefault()}
            onClick={handleCommitAdd}
          >✓</button>
          <button
            style={{ ...btn, background: '#1a0a0a', color: '#dd6666', border: '1px solid #402020' }}
            onMouseDown={e => e.preventDefault()}
            onClick={handleCancelAdd}
          >✕</button>
        </>
      ) : confirmingDelete ? (
        <>
          <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 11, color: '#ff8888', whiteSpace: 'nowrap' }}>
            「{deckName}」削除？
          </span>
          <button
            style={{ ...btn, background: '#2a0a0a', color: '#ff6666', border: '1px solid #602020' }}
            onClick={handleCommitDelete}
          >はい</button>
          <button
            style={{ ...btn, background: '#111', color: '#888', border: '1px solid #333' }}
            onClick={() => setConfirmingDelete(false)}
          >いいえ</button>
        </>
      ) : (
        <>
          {/* + 新規 */}
          <button
            style={{ ...btn, background: '#0a1a0a', color: '#66dd66', border: '1px solid #204020' }}
            title="新規デッキ"
            onMouseEnter={e => (e.currentTarget.style.background = '#0e240e')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0a1a0a')}
            onClick={handleStartAdd}
          >+</button>

          {/* × 削除 */}
          {hasDeck && (
            <button
              style={{ ...btn, background: '#1a0a0a', color: '#dd6666', border: '1px solid #402020' }}
              title="デッキを削除"
              onMouseEnter={e => (e.currentTarget.style.background = '#240e0e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a0a0a')}
              onClick={() => setConfirmingDelete(true)}
            >×</button>
          )}
        </>
      )}

      {/* カード裏面登録 */}
      {hasDeck && (
        <label
          title="デッキ裏面画像を設定"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          {decks[activeDeckIndex]?.cardBack && (
            <img
              src={decks[activeDeckIndex].cardBack}
              alt="card back"
              style={{ height: 22, aspectRatio: '150/210', objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(124,58,237,0.4)' }}
            />
          )}
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7,
            padding: '4px 8px',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 4,
            color: '#A78BFA',
            whiteSpace: 'nowrap',
          }}>
            BACK IMG
          </span>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
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

  function handleDeckCardDrop(cardId: string) {
    const deck = currentDeckFn()
    const entry = deck.find(e => e.cardId === cardId)
    if (!entry) return
    const next = entry.count > 1
      ? deck.map(e => e.cardId === cardId ? { ...e, count: e.count - 1 } : e)
      : deck.filter(e => e.cardId !== cardId)
    loadDeck(next)
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={CRT_STYLE} />

      <DeckHud />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左パネル: カードプール */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(124,58,237,0.2)',
          overflow: 'hidden',
        }}>
          <FilterBar cards={allCards} filter={filter} onChange={setFilter} onAddCard={() => setCardEditorOpen(true)} />
          <LibraryGrid filter={filter} onEditCard={card => setEditingCard(card)} onDeckCardDrop={handleDeckCardDrop} />
        </div>

        {/* 右パネル: デッキ内容 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <DeckPanelHeader />
          <DeckGrid selectedCardId={selectedCardId} onSelect={setSelectedCardId} />
        </div>
      </div>

      <GameLoadDialog />
      {cardEditorOpen && <CardEditorDialog onClose={() => setCardEditorOpen(false)} />}
      {editingCard && <CardEditorDialog card={editingCard} onClose={() => setEditingCard(null)} />}
    </div>
  )
}
