import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { buildDeckFromLibrary } from '../../domain/gameLogic'
import type { GameCard } from '../../domain/types'
import { useSkin } from '../skin/SkinContext'

export function HandHud() {
  const { Button } = useSkin()
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

  return (
    <div className="flex gap-2 px-3 py-1.5 bg-surface border-b border-border items-center flex-wrap">
      <span
        className="font-mono text-[10px] mr-1"
        style={{ color: 'var(--cyan)', textShadow: '0 0 10px rgba(var(--cyan-rgb),0.4)' }}
      >
        手札
      </span>

      <Button
        variant="primary"
        style={{
          background: 'var(--btn-init-bg)',
          color: 'var(--btn-init-color)',
          border: 'var(--btn-init-border)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-init-bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-init-bg)' }}
        onClick={handleInit}
      >
        INIT FIELD
      </Button>

      <Button
        variant="secondary"
        style={{
          background: 'var(--btn-undo-bg)',
          color: 'var(--btn-undo-color)',
          border: 'var(--btn-undo-border)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-undo-bg-hover)'; e.currentTarget.style.color = 'var(--btn-undo-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-undo-bg)'; e.currentTarget.style.color = 'var(--btn-undo-color)' }}
        onClick={undo}
      >
        UNDO
      </Button>

      <Button
        variant="secondary"
        style={{
          background: 'var(--btn-load-bg)',
          color: 'var(--btn-load-color)',
          border: 'var(--btn-load-border)',
          marginLeft: 'auto',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-load-bg-hover)'; e.currentTarget.style.color = 'var(--btn-load-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-load-bg)'; e.currentTarget.style.color = 'var(--btn-load-color)' }}
        onClick={() => openDialog('setup')}
      >
        LOAD CARDS
      </Button>
    </div>
  )
}
