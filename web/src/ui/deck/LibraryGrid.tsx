import { useState } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { applyFilters, type FilterState } from './FilterBar'
import type { Card } from '../../domain/types'

function LibraryCardTile({ card, onEdit }: { card: Card; onEdit: (card: Card) => void }) {
  const { resolveImageUrl, cardBackUrl, fieldDefs } = useLibraryStore.getState()
  const imgUrl = resolveImageUrl(card) || cardBackUrl
  const [hovered, setHovered] = useState(false)

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
      className="flex flex-col items-center gap-1 cursor-grab select-none"
    >
      <div className="relative w-[140px] rounded overflow-hidden border border-border bg-surface2 flex-shrink-0"
        style={{ aspectRatio: '150/210' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface" />
        )}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(card) }}
            onMouseDown={e => e.preventDefault()}
            className="absolute top-1 right-1 w-[22px] h-[22px] text-[11px] flex items-center justify-center rounded cursor-pointer"
            style={{ background: 'rgba(14,18,40,0.85)', border: '1px solid rgba(0,255,200,0.4)', color: '#00FFD0' }}
            title="編集"
          >✎</button>
        )}
      </div>

      <div className="font-body text-[8px] text-muted text-center w-[140px] overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
        {card.name}
      </div>

      {primaryValue !== undefined && (
        <div className="flex gap-1 items-center">
          <span className="font-mono text-[6px] text-accent">
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
      className="flex-1 overflow-y-auto p-2 grid gap-2 rounded-lg transition-all duration-150"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, 152px)',
        alignContent: 'start',
        outline: isDragOver ? '2px dashed rgba(255,100,100,0.4)' : '2px dashed transparent',
        outlineOffset: -4,
      }}
    >
      {filtered.length === 0 && (
        <div className="col-span-full text-muted font-body text-xs p-6 text-center">
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
