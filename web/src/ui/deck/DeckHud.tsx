import { useLibraryStore } from '../../store/libraryStore'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { buildDeckFromLibrary } from '../../domain/gameLogic'
import { useSkin } from '../skin/SkinContext'

export function DeckHud() {
  const { Button } = useSkin()
  const {
    decks,
    activeDeckIndex,
    dirHandle,
    cards,
    currentDeck,
    selectDeck,
    save,
  } = useLibraryStore(s => ({
    decks: s.decks,
    activeDeckIndex: s.activeDeckIndex,
    dirHandle: s.fileHandle,
    cards: s.cards,
    currentDeck: s.currentDeck,
    selectDeck: s.selectDeck,
    save: s.save,
  }))
  const loadToDeck = useGameStore(s => s.loadToDeck)
  const { openDialog, deckPanelOpen, closeDeckPanel } = useUIStore(s => ({
    openDialog: s.openDialog,
    deckPanelOpen: s.deckPanelOpen,
    closeDeckPanel: s.closeDeckPanel,
  }))

  const deck = currentDeck()
  const totalCount = deck.reduce((s, e) => s + e.count, 0)
  const overLimit = totalCount > 40
  const hasDeck = activeDeckIndex >= 0

  async function handleSave() {
    if (!dirHandle) { alert('先にカードライブラリを読み込んでください'); return }
    await save()
  }

  function handleLoadToDeck() {
    const deckCards = buildDeckFromLibrary(cards, deck)
    if (deckCards.length > 0) loadToDeck(deckCards)
  }

  return (
    <div className="flex bg-bg2 border-b border-border flex-shrink-0">
      {/* 左半分: POOL */}
      <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 border-r border-border">
        <span className="font-mono text-[9px] text-accent mr-1" style={{ textShadow: '0 0 12px rgba(0,255,255,0.6)' }}>
          POOL
        </span>
        <Button size="sm" onClick={() => openDialog('setup')}>LOAD POOL</Button>
        <Button size="sm" onClick={handleSave}>SAVE</Button>
      </div>

      {/* 右半分: DECK */}
      <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5">
        <span className="font-mono text-[9px] text-primary-lite mr-1" style={{ textShadow: '0 0 12px rgba(167,139,250,0.5)' }}>
          DECK
        </span>

        <select
          value={activeDeckIndex}
          onChange={e => selectDeck(Number(e.target.value))}
          className="bg-surface2 text-primary-lite border border-border rounded-theme px-2 py-1 font-body text-[11px] cursor-pointer max-w-[160px]"
        >
          {decks.length === 0 && <option value={-1}>— デッキなし —</option>}
          {decks.map((d, i) => (
            <option key={i} value={i}>{d.name}</option>
          ))}
        </select>

        <span className={`font-mono text-[9px] min-w-[52px] ${overLimit ? 'text-danger' : 'text-muted'}`}>
          {totalCount}/40
        </span>

        <Button
          size="sm"
          disabled={!hasDeck || deck.length === 0}
          onClick={handleLoadToDeck}
        >
          TO BOARD
        </Button>

        {deckPanelOpen ? (
          <Button size="sm" className="ml-auto" onClick={closeDeckPanel}>✕ 閉じる</Button>
        ) : (
          <a
            href="/index.html"
            className="ml-auto font-mono text-[8px] px-3 py-1.5 rounded-theme bg-surface2 text-muted border border-border hover:bg-surface hover:text-accent transition-all duration-150 whitespace-nowrap no-underline inline-block"
          >
            ▶ BOARD
          </a>
        )}
      </div>
    </div>
  )
}
