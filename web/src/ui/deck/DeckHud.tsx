import { useLibraryStore } from '../../store/libraryStore'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { buildDeckFromLibrary } from '../../domain/gameLogic'

export function DeckHud() {
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
    dirHandle: s.dirHandle,
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

  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 150ms',
    whiteSpace: 'nowrap',
  }

  const label: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    textShadow: '0 0 12px rgba(0,255,255,0.6)',
    marginRight: 2,
    whiteSpace: 'nowrap',
  }

  async function handleSave() {
    if (!dirHandle) { alert('先にカードライブラリを読み込んでください'); return }
    await save()
  }

  function handleLoadToDeck() {
    const deckCards = buildDeckFromLibrary(cards, deck)
    if (deckCards.length > 0) loadToDeck(deckCards)
  }

  return (
    <div style={{
      display: 'flex',
      background: '#08091a',
      borderBottom: '1px solid rgba(124,58,237,0.2)',
      alignItems: 'stretch',
      flexShrink: 0,
    }}>
      {/* 左半分: POOL */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRight: '1px solid rgba(124,58,237,0.25)',
      }}>
        <span style={{ ...label, color: '#00FFFF' }}>POOL</span>

        <button
          style={{ ...btn, background: '#0c1828', color: '#88aade', border: '1px solid #284060' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#102238')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0c1828')}
          onClick={() => openDialog('setup')}
        >LOAD POOL</button>

        <button
          style={{ ...btn, background: '#0c280c', color: '#88dd88', border: '1px solid #285028' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#103810')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0c280c')}
          onClick={handleSave}
        >SAVE</button>
      </div>

      {/* 右半分: DECK */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
      }}>
        <span style={{ ...label, color: '#A78BFA' }}>DECK</span>

        <select
          value={activeDeckIndex}
          onChange={e => selectDeck(Number(e.target.value))}
          style={{
            background: '#0e1228',
            color: '#A78BFA',
            border: '1px solid rgba(124,58,237,0.5)',
            borderRadius: 4,
            padding: '4px 8px',
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 11,
            cursor: 'pointer',
            maxWidth: 160,
          }}
        >
          {decks.length === 0 && <option value={-1}>— デッキなし —</option>}
          {decks.map((d, i) => (
            <option key={i} value={i}>{d.name}</option>
          ))}
        </select>

        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: overLimit ? '#ff4444' : '#94A3B8',
          minWidth: 52,
        }}>
          {totalCount}/40
        </span>

        <button
          disabled={!hasDeck || deck.length === 0}
          style={{
            ...btn,
            background: hasDeck && deck.length > 0 ? '#0c1c28' : '#111',
            color: hasDeck && deck.length > 0 ? '#88aadd' : '#333',
            border: `1px solid ${hasDeck && deck.length > 0 ? '#284060' : '#222'}`,
            cursor: hasDeck && deck.length > 0 ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={e => { if (hasDeck && deck.length > 0) e.currentTarget.style.background = '#102030' }}
          onMouseLeave={e => { if (hasDeck && deck.length > 0) e.currentTarget.style.background = '#0c1c28' }}
          onClick={handleLoadToDeck}
        >TO BOARD</button>

        {/* BOARD / 閉じる */}
        {deckPanelOpen ? (
          <button
            style={{ ...btn, background: '#0c0c28', color: '#aa88dd', border: '1px solid #404080', marginLeft: 'auto' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#141444')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0c0c28')}
            onClick={closeDeckPanel}
          >✕ 閉じる</button>
        ) : (
          <a
            href="/index.html"
            style={{ ...btn, background: '#0c0c28', color: '#aa88dd', border: '1px solid #404080', textDecoration: 'none', display: 'inline-block', marginLeft: 'auto' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#141444')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0c0c28')}
          >▶ BOARD</a>
        )}
      </div>
    </div>
  )
}
