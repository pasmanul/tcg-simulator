import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { newGameCard } from '../../domain/gameLogic'
import type { GameCard } from '../../domain/types'
import { useSkin } from '../skin/SkinContext'

export function BoardHud() {
  const { Button } = useSkin()
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

  return (
    <div className="flex gap-2 px-3 py-1.5 bg-surface border-b border-border items-center">
      <Button
        variant="ghost"
        style={{ width: 30, height: 30, flexShrink: 0, padding: 0, fontSize: 16, lineHeight: 1 }}
        onClick={toggleSidebar}
        aria-label="メニュー"
      >
        ☰
      </Button>

      <span
        className="font-mono text-[10px] mr-2"
        style={{ color: 'var(--cyan)', textShadow: '0 0 12px rgba(var(--cyan-rgb),0.6)' }}
      >
        TCG SIM
      </span>

      <Button variant="primary" onClick={handleInit}>INIT FIELD</Button>
      <Button variant="secondary" onClick={() => openDialog('dice')}>DICE</Button>
      <Button variant="secondary" onClick={() => openDialog('save-load')}>SAVE/LOAD</Button>
      <Button variant="secondary" onClick={undo}>UNDO</Button>

      <Button
        variant="secondary"
        style={{ marginLeft: 'auto' }}
        onClick={() => window.open('/hand.html', 'hand', 'width=540,height=720')}
      >
        HAND
      </Button>

      <Button variant="secondary" onClick={openDeckPanel}>DECK</Button>
      <Button variant="secondary" onClick={() => openDialog('setup')}>LOAD CARDS</Button>
    </div>
  )
}
