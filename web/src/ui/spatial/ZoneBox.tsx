import { useRef, useState } from 'react'
import type { DragEvent, ReactNode, MouseEvent } from 'react'

export interface DisplayCard {
  instanceId: string
  name: string
  cost?: string | number
  civ?: string
  glow?: string
  titleFg?: string
  tapped: boolean
  masked: boolean
  faceDown: boolean
  imageData?: string
  stackCount?: number
}

interface ZoneBoxProps {
  id: string
  x: number; y: number; w: number; h: number
  title: string
  accent?: string
  cards?: DisplayCard[]
  variant?: 'tiles' | 'pile' | 'list'
  cardScale?: number
  selected?: boolean
  layoutMode?: boolean
  onSelect?: (id: string) => void
  onMove?: (id: string, x: number, y: number) => void
  onResize?: (id: string, w: number, h: number) => void
  onCardClick?: (card: DisplayCard, index: number, e: MouseEvent) => void
  onCardContextMenu?: (card: DisplayCard, index: number, e: MouseEvent) => void
  onCardDragStart?: (card: DisplayCard, e: DragEvent) => void
  onCardDrop?: (e: DragEvent, targetInstanceId?: string) => void
  onCardHover?: (card: DisplayCard | null, pos?: { x: number; y: number }) => void
  headerExtras?: ReactNode
}

export function ZoneBox({
  id, x, y, w, h, title, accent,
  cards = [], variant = 'tiles', cardScale = 1,
  selected, onSelect, onMove, onResize, onCardClick, onCardContextMenu,
  onCardDragStart, onCardDrop, onCardHover,
  layoutMode, headerExtras,
}: ZoneBoxProps) {

  const startDrag = (e: MouseEvent, mode: 'move' | 'resize' = 'move') => {
    if (!layoutMode && mode === 'move') return
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(id)
    const startX = e.clientX, startY = e.clientY
    const start = { x, y, w, h }
    const onMouseMove = (ev: globalThis.MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (mode === 'move') onMove?.(id, start.x + dx, start.y + dy)
      else onResize?.(id, Math.max(220, start.w + dx), Math.max(140, start.h + dy))
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      data-testid={`zone-${id}`}
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h,
        background: 'var(--sp-surface)',
        border: `1px solid ${selected ? 'var(--sp-border-accent)' : 'var(--sp-border)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: selected ? 'var(--sp-shadow-3)' : 'var(--sp-shadow-2)',
        transition: 'box-shadow var(--dur-base) var(--ease)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
      onMouseDown={() => onSelect?.(id)}
      onDragOver={(e) => {
        if (layoutMode) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        if (layoutMode) return
        onCardDrop?.(e)
      }}
    >
      {/* Header */}
      <div
        onMouseDown={(e) => startDrag(e, 'move')}
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 12px',
          borderBottom: '1px solid var(--sp-border)',
          cursor: layoutMode ? 'grab' : 'default',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: accent || 'var(--sp-text-3)',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--sp-text)' }}>
          {title}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)',
          color: 'var(--sp-text-3)', marginLeft: 'auto',
        }}
        data-testid={`zone-${id}-count`}
        >
          {cards.length}
        </span>
        {headerExtras}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: 'var(--space-3)', overflow: 'hidden', minHeight: 0 }}>
        {variant === 'pile' && (
          <PileView
            cards={cards}
            zoneId={id}
            accent={accent}
            onCardClick={onCardClick}
            onCardContextMenu={onCardContextMenu}
            onCardDragStart={onCardDragStart}
            onCardDrop={onCardDrop}
            onCardHover={onCardHover}
            layoutMode={layoutMode}
          />
        )}
        {variant === 'tiles' && (
          <TilesView
            cards={cards}
            cardScale={cardScale}
            onCardClick={onCardClick}
            onCardContextMenu={onCardContextMenu}
            onCardDragStart={onCardDragStart}
            onCardDrop={onCardDrop}
            onCardHover={onCardHover}
            layoutMode={layoutMode}
          />
        )}
        {variant === 'list' && (
          <ListView
            cards={cards}
            onCardClick={onCardClick}
            onCardContextMenu={onCardContextMenu}
            onCardDragStart={onCardDragStart}
            onCardDrop={onCardDrop}
            onCardHover={onCardHover}
            layoutMode={layoutMode}
          />
        )}
      </div>

      {/* Resize handle */}
      {layoutMode && (
        <div
          onMouseDown={(e) => startDrag(e, 'resize')}
          style={{
            position: 'absolute', right: 0, bottom: 0,
            width: 16, height: 16, cursor: 'nwse-resize',
            background: 'linear-gradient(135deg, transparent 50%, var(--sp-border-strong) 50%, var(--sp-border-strong) 60%, transparent 60%, transparent 70%, var(--sp-border-strong) 70%, var(--sp-border-strong) 80%, transparent 80%)',
          }}
        />
      )}
    </div>
  )
}

function PileView({
  cards,
  zoneId,
  accent,
  onCardClick,
  onCardContextMenu,
  onCardDragStart,
  onCardDrop,
  onCardHover,
  layoutMode,
}: {
  cards: DisplayCard[]
  zoneId: string
  accent?: string
  onCardClick?: (c: DisplayCard, i: number, e: MouseEvent) => void
  onCardContextMenu?: (c: DisplayCard, i: number, e: MouseEvent) => void
  onCardDragStart?: (c: DisplayCard, e: DragEvent) => void
  onCardDrop?: (e: DragEvent, targetInstanceId?: string) => void
  onCardHover?: (c: DisplayCard | null, pos?: { x: number; y: number }) => void
  layoutMode?: boolean
}) {
  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topIndex = cards.length - 1
  const topCard = cards[topIndex]

  function clearHover() {
    if (zoomTimer.current) {
      clearTimeout(zoomTimer.current)
      zoomTimer.current = null
    }
    onCardHover?.(null)
  }

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 112 }}>
        {cards.length > 0 && [...Array(Math.min(3, cards.length))].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            transform: `translate(${i * 1.5}px, ${-i * 1.5}px)`,
            background: 'var(--sp-card-bg)',
            border: '1px solid var(--sp-card-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--sp-shadow-1)',
          }} />
        ))}
        {topCard ? (
          <button
            data-testid={`zone-${zoneId}-pile-top`}
            draggable={!layoutMode}
            onClick={(e) => onCardClick?.(topCard, topIndex, e)}
            onContextMenu={(e) => onCardContextMenu?.(topCard, topIndex, e)}
            onDragStart={(e) => onCardDragStart?.(topCard, e)}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={(e) => onCardDrop?.(e, topCard.instanceId)}
            onMouseEnter={(e) => {
              clearHover()
              const pos = { x: e.clientX, y: e.clientY }
              onCardHover?.(topCard)
              zoomTimer.current = setTimeout(() => onCardHover?.(topCard, pos), 500)
            }}
            onMouseLeave={clearHover}
            title={topCard.masked || topCard.faceDown ? '?' : topCard.name}
            style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--sp-card-bg)',
            border: '1px solid var(--sp-card-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--sp-shadow-2)',
            cursor: layoutMode ? 'default' : 'grab',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, color: accent || 'var(--sp-text)',
              lineHeight: 1,
            }}>{cards.length}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)',
              color: 'var(--sp-text-3)', marginTop: 4, letterSpacing: '0.08em',
            }}>CARDS</div>
          </button>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed var(--sp-border-strong)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--sp-text-3)', fontSize: 'var(--fs-xs)',
          }}>empty</div>
        )}
      </div>
    </div>
  )
}

function TilesView({
  cards,
  cardScale = 1,
  onCardClick,
  onCardContextMenu,
  onCardDragStart,
  onCardDrop,
  onCardHover,
  layoutMode,
}: {
  cards: DisplayCard[]
  cardScale?: number
  onCardClick?: (c: DisplayCard, i: number, e: MouseEvent) => void
  onCardContextMenu?: (c: DisplayCard, i: number, e: MouseEvent) => void
  onCardDragStart?: (c: DisplayCard, e: DragEvent) => void
  onCardDrop?: (e: DragEvent, targetInstanceId?: string) => void
  onCardHover?: (c: DisplayCard | null, pos?: { x: number; y: number }) => void
  layoutMode?: boolean
}) {
  if (cards.length === 0) return <EmptyHint label="drag cards here" />
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6,
      alignContent: 'flex-start', height: '100%', overflow: 'auto',
    }}>
      {cards.map((c, i) => (
        <MiniCard
          key={c.instanceId}
          card={c}
          scale={cardScale}
          draggable={!layoutMode}
          onClick={(e) => onCardClick?.(c, i, e)}
          onContextMenu={(e) => onCardContextMenu?.(c, i, e)}
          onDragStart={(e) => onCardDragStart?.(c, e)}
          onDrop={(e) => onCardDrop?.(e, c.instanceId)}
          onHover={(pos) => onCardHover?.(c, pos)}
          onHoverEnd={() => onCardHover?.(null)}
        />
      ))}
    </div>
  )
}

function ListView({
  cards,
  onCardClick,
  onCardContextMenu,
  onCardDragStart,
  onCardDrop,
  onCardHover,
  layoutMode,
}: {
  cards: DisplayCard[]
  onCardClick?: (c: DisplayCard, i: number, e: MouseEvent) => void
  onCardContextMenu?: (c: DisplayCard, i: number, e: MouseEvent) => void
  onCardDragStart?: (c: DisplayCard, e: DragEvent) => void
  onCardDrop?: (e: DragEvent, targetInstanceId?: string) => void
  onCardHover?: (c: DisplayCard | null, pos?: { x: number; y: number }) => void
  layoutMode?: boolean
}) {
  if (cards.length === 0) return <EmptyHint label="—" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
      {cards.map((c, i) => (
        <button key={c.instanceId}
        draggable={!layoutMode}
        onClick={(e) => onCardClick?.(c, i, e)}
        onContextMenu={(e) => onCardContextMenu?.(c, i, e)}
        onDragStart={(e) => onCardDragStart?.(c, e)}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
        onDrop={(e) => onCardDrop?.(e, c.instanceId)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 8px',
          background: 'transparent', border: 'none',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--sp-text)', fontSize: 'var(--fs-sm)',
          textAlign: 'left', cursor: 'pointer',
          transition: 'background var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--sp-surface-2)'
          e.currentTarget.style.transform = 'translateX(4px)'
          onCardHover?.(c)
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.transform = 'none'
          onCardHover?.(null)
        }}
        >
          <span style={{
            width: 4, height: 4, borderRadius: '50%',
            background: c.titleFg || 'var(--sp-text-3)', flexShrink: 0,
          }} />
          <span style={{ flex: 1 }}>{c.masked || c.faceDown ? '?' : c.name}</span>
          {!c.masked && !c.faceDown && c.cost != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--sp-text-3)' }}>
              {c.cost}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--sp-text-3)', fontSize: 'var(--fs-xs)', fontStyle: 'italic',
    }}>{label}</div>
  )
}

function MiniCard({
  card,
  scale = 1,
  draggable,
  onClick,
  onContextMenu,
  onDragStart,
  onDrop,
  onHover,
  onHoverEnd,
}: {
  card: DisplayCard
  scale?: number
  draggable?: boolean
  onClick: (e: MouseEvent) => void
  onContextMenu?: (e: MouseEvent) => void
  onDragStart?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  onHover?: (pos?: { x: number; y: number }) => void
  onHoverEnd?: () => void
}) {
  const [hover, setHover] = useState(false)
  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lift = card.tapped ? 'rotate(90deg)' : hover ? 'translateY(-5px)' : 'none'
  const w = Math.round(56 * scale)
  const h = Math.round(78 * scale)
  const fs = Math.round(8 * scale)
  return (
    <button
      draggable={draggable}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={onDrop}
      onMouseEnter={(e) => {
        setHover(true)
        if (zoomTimer.current) clearTimeout(zoomTimer.current)
        const pos = { x: e.clientX, y: e.clientY }
        onHover?.()
        zoomTimer.current = setTimeout(() => onHover?.(pos), 500)
      }}
      onMouseLeave={() => {
        setHover(false)
        if (zoomTimer.current) { clearTimeout(zoomTimer.current); zoomTimer.current = null }
        onHoverEnd?.()
      }}
      title={card.masked || card.faceDown ? '?' : card.name}
      style={{
        width: w, height: h,
        background: card.imageData
          ? `url(${card.imageData}) center/cover no-repeat`
          : 'var(--sp-card-bg)',
        border: `1px solid ${card.titleFg ? card.titleFg + '55' : 'var(--sp-card-border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: card.imageData ? 0 : 5,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transform: lift,
        transition: 'transform var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease)',
        cursor: 'pointer', textAlign: 'left',
        boxShadow: hover ? 'var(--sp-shadow-3)' : 'var(--sp-shadow-1)',
        flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {(card.masked || card.faceDown) ? (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: Math.round(9 * scale),
          color: 'var(--sp-text-3)', letterSpacing: '0.1em',
          background: 'var(--sp-card-bg)',
        }}>TCG</div>
      ) : !card.imageData ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ fontSize: fs, fontWeight: 600, color: 'var(--sp-text)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {card.name}
            </span>
            {card.cost != null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: fs, color: card.titleFg || 'var(--sp-text-2)', flexShrink: 0 }}>
                {card.cost}
              </span>
            )}
          </div>
          <div style={{
            height: Math.round(28 * scale), borderRadius: 3,
            background: card.glow || 'var(--sp-surface-3)',
            opacity: 0.6,
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: Math.round(7 * scale), color: 'var(--sp-text-3)', textTransform: 'uppercase' }}>
            {card.civ}
          </div>
        </>
      ) : null}
      {/* Stack badge */}
      {card.stackCount != null && card.stackCount > 0 && (
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          background: '#f97316', color: '#fff',
          borderRadius: 4, fontSize: Math.round(7 * scale), fontFamily: 'var(--font-mono)',
          padding: '1px 3px', lineHeight: 1,
        }}>{card.stackCount}</div>
      )}
    </button>
  )
}
