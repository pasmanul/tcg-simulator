import { useMemo } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { buildDeckFromLibrary } from '../../domain/gameLogic'

interface Props {
  style?: React.CSSProperties
}

export function DeckListPanel({ style }: Props) {
  const { cards, currentDeck, resolveImageUrl, cardBackUrl } = useLibraryStore(s => ({
    cards: s.cards,
    currentDeck: s.currentDeck,
    resolveImageUrl: s.resolveImageUrl,
    cardBackUrl: s.cardBackUrl,
  }))
  const initializeField = useGameStore(s => s.initializeField)
  const addLog = useUIStore(s => s.addLog)

  const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards])

  function handleInitField() {
    const deckCards = buildDeckFromLibrary(cards, currentDeck)
    if (deckCards.length === 0) return
    initializeField(deckCards)
    addLog(`フィールド初期化 (${deckCards.length}枚)`)
  }

  return (
    <div
      style={{
        background: '#06080e',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          background: '#0a0e1a',
          borderBottom: '1px solid rgba(124,58,237,0.2)',
          fontFamily: "'VT323', monospace",
          color: '#8899bb',
          fontSize: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>デッキカード一覧 ({currentDeck.reduce((s, e) => s + e.count, 0)}枚)</span>
        <button
          onClick={handleInitField}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            padding: '4px 10px',
            background: 'rgba(124,58,237,0.2)',
            border: '1px solid #7C3AED',
            borderRadius: 4,
            color: '#A78BFA',
            cursor: 'pointer',
          }}
        >
          INIT
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          padding: 6,
        }}
      >
        {currentDeck.map(entry => {
          const card = cardMap.get(entry.cardId)
          if (!card) return null
          const imgUrl = resolveImageUrl(card.image_path) || cardBackUrl
          return (
            <div
              key={entry.cardId}
              title={card.name}
              style={{
                position: 'relative',
                aspectRatio: '150/210',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(124,58,237,0.2)',
                cursor: 'grab',
                background: '#0d1020',
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'text/plain',
                  JSON.stringify({ source_zone: 'deck_list', cardId: entry.cardId }),
                )
              }}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={card.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: '#8899bb',
                    padding: 2,
                    textAlign: 'center',
                    fontFamily: "'Chakra Petch', sans-serif",
                  }}
                >
                  {card.name}
                </div>
              )}
              {/* Count badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  background: 'rgba(0,0,0,0.8)',
                  color: '#ffdd66',
                  fontSize: 9,
                  fontFamily: "'Press Start 2P', monospace",
                  padding: '1px 3px',
                  borderRadius: 2,
                }}
              >
                ×{entry.count}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
