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

  return (
    <div className="flex gap-2 px-3 py-1.5 bg-surface border-b border-border items-center">
      {/* ハンバーガーメニュー */}
      <Button
        variant="ghost"
        onClick={toggleSidebar}
        style={{
          border: '1px solid var(--border)',
          color: 'var(--purple-lite)',
          width: 30,
          height: 30,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: 16,
          lineHeight: 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--purple-rgb),0.15)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
          background: 'var(--btn-dice-bg)',
          color: 'var(--btn-dice-color)',
          border: 'var(--btn-dice-border)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-dice-bg-hover)'; e.currentTarget.style.color = 'var(--btn-dice-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-dice-bg)'; e.currentTarget.style.color = 'var(--btn-dice-color)' }}
        onClick={() => openDialog('dice')}
      >
        DICE
      </Button>

      <Button
        variant="secondary"
        style={{
          background: 'var(--btn-save-bg)',
          color: 'var(--btn-save-color)',
          border: 'var(--btn-save-border)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-save-bg-hover)'; e.currentTarget.style.color = 'var(--btn-save-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-save-bg)'; e.currentTarget.style.color = 'var(--btn-save-color)' }}
        onClick={() => openDialog('save-load')}
      >
        SAVE/LOAD
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
          background: 'var(--btn-hand-bg)',
          color: 'var(--btn-hand-color)',
          border: 'var(--btn-hand-border)',
          marginLeft: 'auto',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-hand-bg-hover)'; e.currentTarget.style.color = 'var(--btn-hand-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-hand-bg)'; e.currentTarget.style.color = 'var(--btn-hand-color)' }}
        onClick={() => window.open('/hand.html', 'hand', 'width=540,height=720')}
      >
        HAND
      </Button>

      <Button
        variant="secondary"
        style={{
          background: 'var(--btn-deck-bg)',
          color: 'var(--btn-deck-color)',
          border: 'var(--btn-deck-border)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-deck-bg-hover)'; e.currentTarget.style.color = 'var(--btn-deck-color-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--btn-deck-bg)'; e.currentTarget.style.color = 'var(--btn-deck-color)' }}
        onClick={openDeckPanel}
      >
        DECK
      </Button>

      <Button
        variant="secondary"
        style={{
          background: 'var(--btn-load-bg)',
          color: 'var(--btn-load-color)',
          border: 'var(--btn-load-border)',
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
