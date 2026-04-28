import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { buildDeckFromLibrary } from '../../domain/gameLogic'
import type { GameCard } from '../../domain/types'

export function HandHud() {
  const { initializeField, undo, zones } = useGameStore(s => ({
    initializeField: s.initializeField,
    undo: s.undo,
    zones: s.zones,
  }))
  const { openDialog, addLog } = useUIStore(s => ({
    openDialog: s.openDialog,
    addLog: s.addLog,
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
      deckCards = buildDeckFromLibrary(cards, currentDeck)
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
  }

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '6px 12px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 10,
        color: 'var(--cyan)',
        textShadow: '0 0 10px rgba(var(--cyan-rgb),0.4)',
        marginRight: 4,
      }}>
        手札
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
        style={{ ...btn, background: 'var(--btn-undo-bg)', color: 'var(--btn-undo-color)', border: 'var(--btn-undo-border)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-undo-bg-hover)'; e.currentTarget.style.color = 'var(--btn-undo-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-undo-bg)'; e.currentTarget.style.color = 'var(--btn-undo-color)' }}
        onClick={undo}
      >
        UNDO
      </button>

      <button
        style={{ ...btn, background: 'var(--btn-load-bg)', color: 'var(--btn-load-color)', border: 'var(--btn-load-border)', marginLeft: 'auto' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-load-bg-hover)'; e.currentTarget.style.color = 'var(--btn-load-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-load-bg)'; e.currentTarget.style.color = 'var(--btn-load-color)' }}
        onClick={() => openDialog('setup')}
      >
        LOAD CARDS
      </button>
    </div>
  )
}
