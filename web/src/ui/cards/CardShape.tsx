import { Group, Rect, Image as KImage, Text, Circle } from 'react-konva'
import useImage from 'use-image'
import type { GameCard } from '../../domain/types'
import { CARD_W, CARD_H } from '../../theme'
import { useLibraryStore } from '../../store/libraryStore'

interface Props {
  gc: GameCard
  x: number
  y: number
  cardW?: number
  cardH?: number
  masked?: boolean
  selected?: boolean
  onTap?: (gc: GameCard) => void
  onContextMenu?: (gc: GameCard, x: number, y: number) => void
  draggable?: boolean
  onDragStart?: (gc: GameCard) => void
  onDragEnd?: (gc: GameCard, x: number, y: number) => void
}

const MARKER_COLORS: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  white: '#f1f5f9',
}

export function CardShape({
  gc,
  x,
  y,
  cardW = CARD_W,
  cardH = CARD_H,
  masked = false,
  selected = false,
  onTap,
  onContextMenu,
  draggable = false,
  onDragStart,
  onDragEnd,
}: Props) {
  const resolveUrl = useLibraryStore(s => s.resolveImageUrl)
  const backUrl = useLibraryStore(s => s.cardBackUrl)

  const showBack = masked || gc.face_down
  const imgUrl = showBack ? backUrl : resolveUrl(gc.card.image_path)
  const [img] = useImage(imgUrl)

  const rotation = gc.tapped ? 90 : 0
  // When tapped, the visual width/height swap; adjust offset to keep top-left anchor
  const offsetX = gc.tapped ? cardH / 2 : cardW / 2
  const offsetY = gc.tapped ? cardW / 2 : cardH / 2

  return (
    <Group
      x={x + (gc.tapped ? cardH / 2 : cardW / 2)}
      y={y + cardH / 2}
      offsetX={gc.tapped ? cardH / 2 : cardW / 2}
      offsetY={cardH / 2}
      rotation={rotation}
      draggable={draggable}
      onClick={() => onTap?.(gc)}
      onContextMenu={(e) => {
        e.evt.preventDefault()
        const stage = e.target.getStage()
        if (!stage) return
        const pos = stage.getPointerPosition()
        if (pos) onContextMenu?.(gc, pos.x, pos.y)
      }}
      onDragStart={() => onDragStart?.(gc)}
      onDragEnd={(e) => {
        const stage = e.target.getStage()
        if (!stage) return
        const pos = stage.getPointerPosition() ?? { x: e.target.x(), y: e.target.y() }
        // Reset position (zone will re-layout)
        e.target.x(x + offsetX)
        e.target.y(y + cardH / 2)
        onDragEnd?.(gc, pos.x, pos.y)
      }}
    >
      {/* Card face / back */}
      {img ? (
        <KImage
          image={img}
          width={cardW}
          height={cardH}
          x={-cardW / 2}
          y={-cardH / 2}
          cornerRadius={6}
        />
      ) : (
        <Rect
          x={-cardW / 2}
          y={-cardH / 2}
          width={cardW}
          height={cardH}
          fill={showBack ? '#1a1a3a' : '#0d1a0d'}
          stroke={showBack ? '#3050a0' : '#205020'}
          strokeWidth={1}
          cornerRadius={6}
        />
      )}

      {/* Card name placeholder when no image */}
      {!img && !showBack && (
        <Text
          x={-cardW / 2 + 4}
          y={-cardH / 2 + 8}
          width={cardW - 8}
          text={gc.card.name}
          fontSize={11}
          fill="#aaccaa"
          fontFamily="'Chakra Petch', sans-serif"
          wrap="word"
        />
      )}

      {/* Selection border */}
      {selected && (
        <Rect
          x={-cardW / 2 - 2}
          y={-cardH / 2 - 2}
          width={cardW + 4}
          height={cardH + 4}
          stroke="#50b4ff"
          strokeWidth={3}
          fill="transparent"
          cornerRadius={8}
        />
      )}

      {/* Tapped overlay tint */}
      {gc.tapped && (
        <Rect
          x={-cardW / 2}
          y={-cardH / 2}
          width={cardW}
          height={cardH}
          fill="rgba(255,200,0,0.12)"
          cornerRadius={6}
        />
      )}

      {/* Marker badge */}
      {gc.marker && MARKER_COLORS[gc.marker] && (
        <Circle
          x={cardW / 2 - 10}
          y={-cardH / 2 + 10}
          radius={7}
          fill={MARKER_COLORS[gc.marker]}
          stroke="#000"
          strokeWidth={1}
        />
      )}

      {/* Stack count badge */}
      {gc.under_cards.length > 0 && (
        <Rect
          x={-cardW / 2 + 2}
          y={-cardH / 2 + 2}
          width={20}
          height={16}
          fill="#e07020"
          cornerRadius={3}
        />
      )}
      {gc.under_cards.length > 0 && (
        <Text
          x={-cardW / 2 + 2}
          y={-cardH / 2 + 3}
          width={20}
          text={String(gc.under_cards.length + 1)}
          fontSize={10}
          fill="#fff"
          align="center"
          fontFamily="monospace"
        />
      )}
    </Group>
  )
}
