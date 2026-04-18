import { useState } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { applyFilters, type FilterState } from './FilterBar'
import type { Card } from '../../domain/types'

function LibraryCardTile({ card, onEdit }: { card: Card; onEdit: (card: Card) => void }) {
  const { resolveImageUrl, cardBackUrl, fieldDefs } = useLibraryStore.getState()
  const imgUrl = resolveImageUrl(card) || cardBackUrl
  const [hovered, setHovered] = useState(false)

  // sortable な数値フィールドのうち先頭を主要フィールドとして表示
  const primaryField = fieldDefs.find(f => f.sortable && f.type === 'number')
  const primaryValue = primaryField ? card.fields[primaryField.id] : undefined

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={card.name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div style={{
        position: 'relative',
        width: 140,
        aspectRatio: '150/210',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(124,58,237,0.3)',
        background: '#0d1020',
        flexShrink: 0,
      }}>
        {imgUrl ? (
          <img src={imgUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
        )}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(card) }}
            onMouseDown={e => e.preventDefault()}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'rgba(14,18,40,0.85)',
              border: '1px solid rgba(0,255,200,0.4)',
              color: '#00FFD0',
              borderRadius: 4,
              width: 22,
              height: 22,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            title="編集"
          >✎</button>
        )}
      </div>

      <div style={{
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
        width: 140,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>
        {card.name}
      </div>

      {primaryValue !== undefined && (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#44bbff' }}>
            {primaryField!.label.charAt(0)}{primaryValue}
          </span>
        </div>
      )}
    </div>
  )
}

interface Props {
  filter: FilterState
  onEditCard: (card: Card) => void
  onDeckCardDrop: (cardId: string) => void
}

export function LibraryGrid({ filter, onEditCard, onDeckCardDrop }: Props) {
  const cards = useLibraryStore(s => s.cards)
  const fieldDefs = useLibraryStore(s => s.fieldDefs)
  const filtered = applyFilters(cards, filter, fieldDefs)
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.source === 'deck' && parsed.cardId) {
        onDeckCardDrop(parsed.cardId)
      }
    } catch {
      // ignore
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!isDragOver) setIsDragOver(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
      onDrop={handleDrop}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 152px)',
        gap: 8,
        alignContent: 'start',
        outline: isDragOver ? '2px dashed rgba(255,100,100,0.4)' : '2px dashed transparent',
        outlineOffset: -4,
        borderRadius: 8,
        transition: 'outline 150ms',
      }}>
      {filtered.length === 0 && (
        <div style={{
          gridColumn: '1 / -1',
          color: '#505c78',
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 12,
          padding: 24,
          textAlign: 'center',
        }}>
          {cards.length === 0
            ? 'カードライブラリを読み込んでください'
            : '条件に一致するカードがありません'}
        </div>
      )}
      {filtered.map(card => (
        <LibraryCardTile key={card.id} card={card} onEdit={onEditCard} />
      ))}
    </div>
  )
}
