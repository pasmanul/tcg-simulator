import { useLibraryStore } from '../../store/libraryStore'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { buildDeckFromLibrary } from '../../domain/gameLogic'

export function DeckHud() {
  const {
    deckFiles,
    currentDeck,
    deckName,
    dirHandle,
    loadDeckFile,
    saveDeckFile,
    loadDeck,
    newDeck,
    exportDeckJson,
    exportPoolJson,
    cards,
  } = useLibraryStore(s => ({
    deckFiles: s.deckFiles,
    currentDeck: s.currentDeck,
    deckName: s.deckName,
    dirHandle: s.dirHandle,
    loadDeckFile: s.loadDeckFile,
    saveDeckFile: s.saveDeckFile,
    loadDeck: s.loadDeck,
    newDeck: s.newDeck,
    exportDeckJson: s.exportDeckJson,
    exportPoolJson: s.exportPoolJson,
    cards: s.cards,
  }))
  const loadToDeck = useGameStore(s => s.loadToDeck)
  const { openDialog, deckPanelOpen, closeDeckPanel } = useUIStore(s => ({
    openDialog: s.openDialog,
    deckPanelOpen: s.deckPanelOpen,
    closeDeckPanel: s.closeDeckPanel,
  }))

  const totalCount = currentDeck.reduce((s, e) => s + e.count, 0)
  const overLimit = totalCount > 40
  const hasPool = cards.length > 0

  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 150ms',
    whiteSpace: 'nowrap',
  }

  async function handleSave() {
    if (!dirHandle) {
      alert('先にカードライブラリを読み込んでください')
      return
    }
    if (!deckName.trim()) {
      alert('デッキ名を入力してください')
      return
    }
    await saveDeckFile()
  }

  async function handleSelectDeck(filename: string) {
    if (!filename) {
      newDeck()
      return
    }
    await loadDeckFile(filename)
    const { cards, currentDeck } = useLibraryStore.getState()
    const deckCards = buildDeckFromLibrary(cards, currentDeck)
    if (deckCards.length > 0) loadToDeck(deckCards)
  }

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '6px 12px',
      background: '#08091a',
      borderBottom: '1px solid rgba(124,58,237,0.2)',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        color: '#00FFFF',
        textShadow: '0 0 12px rgba(0,255,255,0.6)',
        marginRight: 4,
      }}>
        DECK
      </span>

      {/* デッキ選択 */}
      <select
        value={deckName}
        onChange={e => handleSelectDeck(e.target.value)}
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
        <option value="">— 新規 —</option>
        {deckFiles.map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* デッキ名入力 */}
      <input
        type="text"
        placeholder="デッキ名"
        value={deckName}
        onChange={e => loadDeck({ cards: currentDeck, name: e.target.value })}
        style={{
          background: '#0e1228',
          color: '#E2E8F0',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 12,
          width: 160,
        }}
      />

      {/* 枚数 */}
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        color: overLimit ? '#ff4444' : '#94A3B8',
        minWidth: 52,
      }}>
        {totalCount}/40
      </span>

      {/* SAVE */}
      <button
        style={{
          ...btn,
          background: '#0c280c',
          color: '#88dd88',
          border: '1px solid #285028',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#103810')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0c280c')}
        onClick={handleSave}
      >
        SAVE
      </button>

      {/* EXPORT DECK */}
      <button
        style={{
          ...btn,
          background: '#0c1c14',
          color: '#66ddaa',
          border: '1px solid #225040',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#102618')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0c1c14')}
        onClick={exportDeckJson}
      >
        EXPORT
      </button>

      {/* EXPORT POOL */}
      <button
        disabled={!hasPool}
        style={{
          ...btn,
          background: hasPool ? '#0c1c14' : '#111',
          color: hasPool ? '#44bbdd' : '#333',
          border: `1px solid ${hasPool ? '#205060' : '#222'}`,
          cursor: hasPool ? 'pointer' : 'not-allowed',
        }}
        onMouseEnter={e => { if (hasPool) e.currentTarget.style.background = '#102030' }}
        onMouseLeave={e => { if (hasPool) e.currentTarget.style.background = '#0c1c14' }}
        onClick={exportPoolJson}
      >
        POOL
      </button>

      {/* LOAD CARDS */}
      <button
        style={{
          ...btn,
          background: '#0c1828',
          color: '#88aade',
          border: '1px solid #284060',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#102238')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0c1828')}
        onClick={() => openDialog('setup')}
      >
        LOAD CARDS
      </button>

      {/* BOARD リンク / 閉じるボタン */}
      {deckPanelOpen ? (
        <button
          style={{
            ...btn,
            background: '#0c0c28',
            color: '#aa88dd',
            border: '1px solid #404080',
            marginLeft: 'auto',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#141444')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0c0c28')}
          onClick={closeDeckPanel}
        >
          ✕ 閉じる
        </button>
      ) : (
        <a
          href="/index.html"
          style={{
            ...btn,
            background: '#0c0c28',
            color: '#aa88dd',
            border: '1px solid #404080',
            textDecoration: 'none',
            display: 'inline-block',
            marginLeft: 'auto',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#141444')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0c0c28')}
        >
          ▶ BOARD
        </a>
      )}
    </div>
  )
}
