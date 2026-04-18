import { useMemo } from 'react'
import { useLibraryStore } from '../../store/libraryStore'

interface Props {
  style?: React.CSSProperties
}

export function DeckListPanel({ style }: Props) {
  const { cards, currentDeckFn, resolveImageUrl, cardBackUrl } = useLibraryStore(s => ({
    cards: s.cards,
    currentDeckFn: s.currentDeck,
    resolveImageUrl: s.resolveImageUrl,
    cardBackUrl: s.cardBackUrl,
  }))
  const currentDeck = currentDeckFn()

  const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards])

  return (
    <div
      style={{
        background: '#06080e',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
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
        }}
      >
        <span>デッキカード一覧 ({currentDeck.reduce((s, e) => s + e.count, 0)}枚)</span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          padding: 6,
        }}
      >
        {currentDeck.map(entry => {
          const card = cardMap.get(entry.cardId)
          if (!card) return null
          const imgUrl = resolveImageUrl(card) || cardBackUrl
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
