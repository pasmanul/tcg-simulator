import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { CARD_W, CARD_H } from '../../theme'

const ZOOM = 2.5
const ZW = Math.round(CARD_W * ZOOM)
const ZH = Math.round(CARD_H * ZOOM)
const OFFSET = 16

export function CardZoomOverlay() {
  const { zoomCard, zoomPos } = useUIStore(s => ({ zoomCard: s.zoomCard, zoomPos: s.zoomPos }))
  const resolveImageUrl = useLibraryStore(s => s.resolveImageUrl)
  const cardBackUrl = useLibraryStore(s => s.cardBackUrl)

  if (!zoomCard || !zoomPos) return null

  const showBack = zoomCard.face_down
  const imgUrl = showBack ? cardBackUrl : resolveImageUrl(zoomCard.card)

  // viewport端からはみ出さないよう位置調整
  const left = zoomPos.x + OFFSET + ZW > window.innerWidth
    ? zoomPos.x - ZW - OFFSET
    : zoomPos.x + OFFSET
  const top = Math.min(zoomPos.y, window.innerHeight - ZH - 8)

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: ZW,
        height: ZH,
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(124,58,237,0.7), 0 4px 24px rgba(0,0,0,0.8)',
        border: '2px solid rgba(124,58,237,0.6)',
        pointerEvents: 'none',
        zIndex: 9000,
        background: '#0d1020',
      }}
    >
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={zoomCard.card.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8899bb',
            fontSize: 18,
            fontFamily: "'Chakra Petch', sans-serif",
            padding: 16,
            textAlign: 'center',
          }}
        >
          {zoomCard.card.name}
        </div>
      )}
    </div>
  )
}
