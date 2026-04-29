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
        className="w-[30px] h-[30px] shrink-0 !p-0 text-base leading-none"
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
      <Button variant="secondary" onClick={() => openDialog('dice')}
        style={{ background: '#0d1035', color: '#7799ee', border: '1px solid rgba(50,70,160,0.6)' }}>DICE</Button>
      <Button variant="secondary" onClick={() => openDialog('save-load')}
        style={{ background: '#061816', color: '#44bb99', border: '1px solid rgba(30,100,80,0.6)' }}>SAVE/LOAD</Button>
      <Button variant="secondary" onClick={undo}
        style={{ background: '#180808', color: '#dd7777', border: '1px solid rgba(120,30,30,0.6)' }}>UNDO</Button>

      <Button
        variant="secondary"
        style={{ marginLeft: 'auto', background: '#061412', color: '#44cc88', border: '1px solid rgba(25,90,60,0.6)' }}
        onClick={() => window.open('/hand.html', 'hand', 'width=540,height=720')}
      >
        HAND
      </Button>

      <Button variant="secondary" onClick={openDeckPanel}
        style={{ background: '#080820', color: '#9977dd', border: '1px solid rgba(60,40,140,0.6)' }}>DECK</Button>
      <Button variant="secondary" onClick={() => openDialog('setup')}
        style={{ background: '#060c1c', color: '#6699cc', border: '1px solid rgba(30,60,110,0.6)' }}>LOAD CARDS</Button>
    </div>
  )
}
