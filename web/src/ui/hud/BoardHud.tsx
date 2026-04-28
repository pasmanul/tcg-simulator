import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { newGameCard } from '../../domain/gameLogic'
import type { GameCard } from '../../domain/types'

export function BoardHud() {
  const { undo, initializeField, zones } = useGameStore(s => ({
    undo: s.undo,
    initializeField: s.initializeField,
    zones: s.zones,
  }))
  const { openDialog, openDeckPanel, addLog, toggleSidebar } = useUIStore(s => ({
    openDialog: s.openDialog,
    openDeckPanel: s.openDeckPanel,
    addLog: s.addLog,
    toggleSidebar: s.toggleSidebar,
  }))
  const { cards, currentDeckFn } = useLibraryStore(s => ({
    cards: s.cards,
    currentDeckFn: s.currentDeck,
  }))
  const currentDeck = currentDeckFn()

  function flattenCards(gcs: GameCard[]): GameCard[] {
    return gcs.flatMap(gc => [gc, ...flattenCards(gc.under_cards)])
  }

  function handleInit() {
    let deckCards: GameCard[]

    if (cards.length === 0) {
      // ライブラリ未ロード（ダミーモード）: 全ゾーンのカードを集めて使う
      deckCards = Object.values(zones).flatMap(zone => flattenCards(zone.cards))
    } else {
      const cardMap = new Map(cards.map(c => [c.id, c]))
      deckCards = currentDeck.flatMap(entry => {
        const card = cardMap.get(entry.cardId)
        if (!card) return []
        return Array.from({ length: entry.count }, () => newGameCard(card))
      })
    }

    if (deckCards.length === 0) {
      addLog('デッキが空です')
      return
    }
    initializeField(deckCards)
    addLog(`フィールド初期化 — ${deckCards.length}枚`)
  }

  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 150ms',
    whiteSpace: 'nowrap' as const,
  }

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '6px 12px',
      background: 'var(--surface)',
      borderBottom: '1px solid rgba(var(--purple-rgb),0.2)',
      alignItems: 'center',
    }}>
      {/* ハンバーガーメニュー */}
      <button
        onClick={toggleSidebar}
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 5,
          color: 'var(--purple-lite)',
          fontSize: 16,
          lineHeight: 1,
          width: 30,
          height: 30,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--purple-rgb),0.15)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        aria-label="メニュー"
      >
        ☰
      </button>

      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 10,
        color: 'var(--cyan)',
        textShadow: '0 0 12px rgba(var(--cyan-rgb),0.6)',
        marginRight: 8,
      }}>
        TCG SIM
      </span>

      <button
        style={{ ...btn, background: 'var(--btn-init-bg)', color: 'var(--btn-init-color)', border: 'var(--btn-init-border)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-init-bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-init-bg)' }}
        onClick={handleInit}
      >
        INIT FIELD
      </button>

      <button
        style={{ ...btn, background: 'var(--btn-dice-bg)', color: 'var(--btn-dice-color)', border: 'var(--btn-dice-border)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-dice-bg-hover)'; e.currentTarget.style.color = 'var(--btn-dice-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-dice-bg)'; e.currentTarget.style.color = 'var(--btn-dice-color)' }}
        onClick={() => openDialog('dice')}
      >
        DICE
      </button>

      <button
        style={{ ...btn, background: 'var(--btn-save-bg)', color: 'var(--btn-save-color)', border: 'var(--btn-save-border)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-save-bg-hover)'; e.currentTarget.style.color = 'var(--btn-save-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-save-bg)'; e.currentTarget.style.color = 'var(--btn-save-color)' }}
        onClick={() => openDialog('save-load')}
      >
        SAVE/LOAD
      </button>

      <button
        style={{ ...btn, background: 'var(--btn-undo-bg)', color: 'var(--btn-undo-color)', border: 'var(--btn-undo-border)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-undo-bg-hover)'; e.currentTarget.style.color = 'var(--btn-undo-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-undo-bg)'; e.currentTarget.style.color = 'var(--btn-undo-color)' }}
        onClick={undo}
      >
        UNDO
      </button>

      <button
        style={{ ...btn, background: 'var(--btn-hand-bg)', color: 'var(--btn-hand-color)', border: 'var(--btn-hand-border)', marginLeft: 'auto' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-hand-bg-hover)'; e.currentTarget.style.color = 'var(--btn-hand-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-hand-bg)'; e.currentTarget.style.color = 'var(--btn-hand-color)' }}
        onClick={() => window.open('/hand.html', 'hand', 'width=540,height=720')}
      >
        HAND
      </button>

      <button
        style={{ ...btn, background: 'var(--btn-deck-bg)', color: 'var(--btn-deck-color)', border: 'var(--btn-deck-border)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-deck-bg-hover)'; e.currentTarget.style.color = 'var(--btn-deck-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-deck-bg)'; e.currentTarget.style.color = 'var(--btn-deck-color)' }}
        onClick={openDeckPanel}
      >
        DECK
      </button>

      <button
        style={{ ...btn, background: 'var(--btn-load-bg)', color: 'var(--btn-load-color)', border: 'var(--btn-load-border)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-load-bg-hover)'; e.currentTarget.style.color = 'var(--btn-load-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-load-bg)'; e.currentTarget.style.color = 'var(--btn-load-color)' }}
        onClick={() => openDialog('setup')}
      >
        LOAD CARDS
      </button>
    </div>
  )
}
