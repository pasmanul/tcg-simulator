import { useState, useMemo } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { Button } from '../components/Button'

function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  function show(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(null), 2500)
  }
  return { msg, show }
}

interface Props {
  selectedCardId: string | null
  onSelect: (cardId: string | null) => void
}

export function DeckGrid({ selectedCardId, onSelect }: Props) {
  const { currentDeckFn, cards, resolveImageUrl, cardBackUrl, loadDeck } = useLibraryStore(s => ({
    currentDeckFn: s.currentDeck,
    cards: s.cards,
    resolveImageUrl: s.resolveImageUrl,
    cardBackUrl: s.cardBackUrl,
    loadDeck: s.loadDeck,
  }))
  const currentDeck = currentDeckFn()
  const { msg: toastMsg, show: showToast } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards])
  const totalCount = currentDeck.reduce((s, e) => s + e.count, 0)

  function addCard(cardId: string) {
    const existing = currentDeck.find(e => e.cardId === cardId)
    if (existing && existing.count >= 4) { showToast('同じカードは4枚まで'); return }
    if (totalCount >= 40) { showToast('デッキは40枚まで'); return }
    const next = existing
      ? currentDeck.map(e => e.cardId === cardId ? { ...e, count: e.count + 1 } : e)
      : [...currentDeck, { cardId, count: 1 }]
    loadDeck(next)
  }

  function decCard(cardId: string) {
    const entry = currentDeck.find(e => e.cardId === cardId)
    if (!entry) return
    const next = entry.count > 1
      ? currentDeck.map(e => e.cardId === cardId ? { ...e, count: e.count - 1 } : e)
      : currentDeck.filter(e => e.cardId !== cardId)
    if (entry.count === 1) onSelect(null)
    loadDeck(next)
  }

  function removeCard(cardId: string) {
    loadDeck(currentDeck.filter(e => e.cardId !== cardId))
    onSelect(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.source === 'deck') return
      if (parsed.cardId) addCard(parsed.cardId)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ドロップ領域 */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className="flex-1 overflow-y-auto p-2 grid gap-2 rounded-lg transition-all duration-150"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, 152px)',
          alignContent: 'start',
          justifyContent: 'start',
          background: isDragOver ? 'rgba(0,255,255,0.04)' : 'transparent',
          border: isDragOver ? '2px dashed rgba(0,255,255,0.4)' : '2px dashed transparent',
          minHeight: 120,
        }}
      >
        {currentDeck.length === 0 && !isDragOver && (
          <div className="col-span-full text-muted font-body text-xs p-6 text-center opacity-30">
            ← 左からカードをドロップ
          </div>
        )}
        {currentDeck.map(entry => {
          const card = cardMap.get(entry.cardId)
          if (!card) return null
          const imgUrl = resolveImageUrl(card) || cardBackUrl
          const isSelected = entry.cardId === selectedCardId
          return (
            <div
              key={entry.cardId}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'deck', cardId: entry.cardId }))
                e.dataTransfer.effectAllowed = 'move'
              }}
              onMouseEnter={() => setHoveredId(entry.cardId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelect(isSelected ? null : entry.cardId)}
              className="flex flex-col items-center gap-1 cursor-grab select-none"
            >
              <div
                className="relative w-[140px] flex-shrink-0 rounded overflow-visible bg-surface2"
                style={{
                  aspectRatio: '150/210',
                  border: isSelected ? '2px solid var(--cyan)' : '1px solid rgba(0,255,255,0.2)',
                  boxShadow: isSelected ? '0 0 8px rgba(0,255,255,0.5)' : 'none',
                }}
              >
                <div className="w-full h-full overflow-hidden rounded-[3px]">
                  {imgUrl ? (
                    <img src={imgUrl} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface" />
                  )}
                </div>
                {/* 枚数バッジ */}
                <div className="absolute -bottom-1.5 -right-1.5 font-mono text-[9px] px-1 rounded leading-[1.4]"
                  style={{ background: '#0a0e1a', border: '1px solid rgba(0,255,255,0.4)', color: '#ffdd66' }}>
                  ×{entry.count}
                </div>
                {/* ホバー一括削除ボタン */}
                {hoveredId === entry.cardId && (
                  <button
                    onClick={e => { e.stopPropagation(); removeCard(entry.cardId) }}
                    onMouseDown={e => e.preventDefault()}
                    className="absolute top-1 right-1 w-[22px] h-[22px] text-xs flex items-center justify-center rounded cursor-pointer"
                    style={{ background: 'rgba(20,8,8,0.88)', border: '1px solid rgba(255,80,80,0.5)', color: '#ff6666' }}
                    title="デッキから全削除"
                  >✕</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* +1 / -1 / 削除 */}
      <div className="flex gap-1.5 p-2 border-t border-border flex-shrink-0">
        {([
          { action: 'inc', label: '+1', variant: 'secondary' },
          { action: 'dec', label: '-1', variant: 'secondary' },
          { action: 'del', label: '削除', variant: 'danger' },
        ] as const).map(({ action, label, variant }) => (
          <Button
            key={action}
            size="sm"
            variant={variant}
            disabled={!selectedCardId}
            className="flex-1"
            onClick={() => {
              if (!selectedCardId) return
              if (action === 'inc') addCard(selectedCardId)
              else if (action === 'dec') decCard(selectedCardId)
              else removeCard(selectedCardId)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* トースト */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-body text-[13px] px-5 py-2 rounded-lg pointer-events-none z-[9000]"
          style={{ background: '#1a0a0a', border: '1px solid #cc3333', color: '#ff8888', boxShadow: '0 0 20px rgba(255,0,0,0.2)' }}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}
