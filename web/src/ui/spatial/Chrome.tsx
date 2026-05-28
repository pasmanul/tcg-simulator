import { useState, useEffect, useRef, type DragEvent, type ReactNode, type MouseEvent } from 'react'
import type { DisplayCard } from './ZoneBox'

// ─────────────────────────────────────────────────────────
// FloatingToolbar — top-center, semi-transparent
// ─────────────────────────────────────────────────────────
interface FloatingToolbarProps {
  onMenu?: () => void
  onInit?: () => void
  onDraw?: () => void
  onUndo?: () => void
  onDice?: () => void
  onSave?: () => void
  onLoad?: () => void
  onHand?: () => void
  onDeck?: () => void
  layoutMode?: boolean
  onToggleLayout?: () => void
  tone?: 'dusk' | 'dawn'
  onToggleTone?: () => void
}

export function FloatingToolbar({
  onMenu, onInit, onDraw, onUndo, onDice, onSave, onLoad,
  onHand, onDeck, layoutMode, onToggleLayout, tone, onToggleTone,
}: FloatingToolbarProps) {
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 4,
      padding: 6,
      background: 'var(--sp-surface)',
      border: '1px solid var(--sp-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--sp-shadow-2)',
      backdropFilter: 'blur(20px)',
      whiteSpace: 'nowrap',
    }}>
      <TBButton onClick={onMenu} icon="☰" label="Menu" />
      <Divider />
      <TBButton onClick={onInit} icon="◐" label="Init Field" primary />
      <TBButton onClick={onDraw} icon="↓" label="Draw" />
      <TBButton onClick={onUndo} icon="↶" label="Undo" />
      <Divider />
      <TBButton onClick={onDice} icon="⚂" label="Dice" />
      <TBButton onClick={onSave} icon="◇" label="Save/Load" />
      <TBButton onClick={onLoad} icon="◈" label="Load Cards" />
      <Divider />
      <TBButton onClick={onHand} icon="✋" label="Hand Win." />
      <TBButton onClick={onDeck} icon="📦" label="Deck" />
      <Divider />
      <TBButton
        onClick={onToggleLayout}
        icon={layoutMode ? '✓' : '⊞'}
        label={layoutMode ? 'Done' : 'Edit Layout'}
        active={layoutMode}
      />
      {onToggleTone && (
        <TBButton
          onClick={onToggleTone}
          icon={tone === 'dawn' ? '☀' : '☾'}
          label={tone === 'dawn' ? 'Dawn' : 'Dusk'}
        />
      )}
    </div>
  )
}

function TBButton({ onClick, icon, label, primary, active }: {
  onClick?: () => void; icon: string; label: string; primary?: boolean; active?: boolean
}) {
  const [hover, setHover] = useState(false)
  const bg = active ? 'var(--sp-accent-soft)' :
             primary ? 'var(--sp-accent)' :
             hover ? 'var(--sp-surface-2)' : 'transparent'
  const fg = active ? 'var(--sp-accent)' :
             primary ? 'var(--sp-text-on-accent)' :
             'var(--sp-text)'
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px',
        background: bg, color: fg,
        border: 'none', borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--fs-sm)', fontWeight: 500,
        cursor: 'pointer',
        transition: 'background var(--dur-fast) var(--ease)',
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: 'var(--sp-border)', margin: '0 2px', flexShrink: 0 }} />
}

// ─────────────────────────────────────────────────────────
// LayersPanel — left-floating, zone list
// ─────────────────────────────────────────────────────────
interface LayerZone {
  id: string; title: string; accent: string; count: number
}

interface LayersPanelProps {
  zones: LayerZone[]
  selected: string | null
  onSelect: (id: string) => void
  onAddZone?: () => void
  layoutMode?: boolean
}

export function LayersPanel({ zones, selected, onSelect, onAddZone, layoutMode }: LayersPanelProps) {
  return (
    <div style={{
      position: 'absolute', left: 16, top: 80, zIndex: 40,
      width: 200,
      background: 'var(--sp-surface)',
      border: '1px solid var(--sp-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--sp-shadow-2)',
      padding: 8,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 8px 8px',
      }}>
        <span style={{
          fontSize: 'var(--fs-2xs)', fontFamily: 'var(--font-mono)',
          color: 'var(--sp-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>Zones</span>
        {layoutMode && onAddZone && (
          <button onClick={onAddZone} title="Add zone" style={{
            background: 'transparent', border: 'none', color: 'var(--sp-text-2)',
            fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1,
          }}>+</button>
        )}
      </div>
      {zones.map(z => (
        <button key={z.id} onClick={() => onSelect(z.id)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '6px 8px',
          background: selected === z.id ? 'var(--sp-accent-soft)' : 'transparent',
          border: 'none', borderRadius: 'var(--radius-xs)',
          color: 'var(--sp-text)', fontSize: 'var(--fs-sm)',
          cursor: 'pointer', textAlign: 'left',
          transition: 'background var(--dur-fast) var(--ease)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.accent, flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.title}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--sp-text-3)' }}>
            {z.count}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// InspectorPanel — right-floating, layout-mode position editor
// ─────────────────────────────────────────────────────────
interface InspectorZone {
  id: string; title: string; x: number; y: number; w: number; h: number
}

interface InspectorPanelProps {
  zone: InspectorZone | null
  onUpdate: (patch: Partial<{ x: number; y: number; w: number; h: number }>) => void
  onClose: () => void
}

export function InspectorPanel({ zone, onUpdate, onClose }: InspectorPanelProps) {
  if (!zone) return null
  return (
    <div style={{
      position: 'absolute', right: 16, top: 80, zIndex: 40,
      width: 220,
      background: 'var(--sp-surface)',
      border: '1px solid var(--sp-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--sp-shadow-2)',
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{
          fontSize: 'var(--fs-2xs)', fontFamily: 'var(--font-mono)',
          color: 'var(--sp-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>Zone · {zone.title}</span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'var(--sp-text-3)',
          cursor: 'pointer', fontSize: 14, lineHeight: 1,
        }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <NumField label="X" value={zone.x} onChange={v => onUpdate({ x: v })} />
        <NumField label="Y" value={zone.y} onChange={v => onUpdate({ y: v })} />
        <NumField label="W" value={zone.w} onChange={v => onUpdate({ w: v })} />
        <NumField label="H" value={zone.h} onChange={v => onUpdate({ h: v })} />
      </div>
    </div>
  )
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--fs-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--sp-text-3)' }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: 'var(--sp-surface-3)', border: '1px solid var(--sp-border)',
          borderRadius: 'var(--radius-xs)', padding: '4px 6px',
          fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-mono)',
          color: 'var(--sp-text)', width: '100%', outline: 'none',
        }}
      />
    </label>
  )
}

// ─────────────────────────────────────────────────────────
// HandDock — bottom of screen, persistent hand zone
// Supports drag/resize in layoutMode via position prop
// ─────────────────────────────────────────────────────────
interface HandDockProps {
  cards: DisplayCard[]
  onCardClick?: (card: DisplayCard, index: number, e: MouseEvent) => void
  onCardContextMenu?: (card: DisplayCard, index: number, e: MouseEvent) => void
  onCardDragStart?: (card: DisplayCard, e: DragEvent) => void
  onCardDrop?: (e: DragEvent, targetInstanceId?: string) => void
  onCardHover?: (card: DisplayCard | null, pos?: { x: number; y: number }) => void
  layoutMode?: boolean
  position?: { x: number; y: number; w: number; h: number }
  onInitPosition?: (x: number, y: number, w: number, h: number) => void
  onMove?: (x: number, y: number) => void
  onResize?: (w: number, h: number) => void
  selected?: boolean
  onSelect?: () => void
}

export function HandDock({
  cards,
  onCardClick,
  onCardContextMenu,
  onCardDragStart,
  onCardDrop,
  onCardHover,
  layoutMode,
  position,
  onInitPosition,
  onMove,
  onResize,
  selected,
  onSelect,
}: HandDockProps) {
  const ref = useRef<HTMLDivElement>(null)

  // layoutMode ON かつ position 未設定 → DOM rect から即座に確定させる
  useEffect(() => {
    if (layoutMode && !position && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      onInitPosition?.(rect.left, rect.top, rect.width, rect.height)
    }
  }, [layoutMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (e: MouseEvent, mode: 'move' | 'resize' = 'move') => {
    if (!layoutMode) return
    e.preventDefault()
    e.stopPropagation()
    onSelect?.()
    const currentPos = position
    if (!currentPos) return  // useEffect で事前確定済みのはずなので通常ここには来ない
    const startX = e.clientX, startY = e.clientY
    const start = { ...currentPos }
    const onMouseMove = (ev: globalThis.MouseEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY
      if (mode === 'move') onMove?.(start.x + dx, start.y + dy)
      else onResize?.(Math.max(300, start.w + dx), Math.max(100, start.h + dy))
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const posStyle: React.CSSProperties = position
    ? { position: 'absolute', left: position.x, top: position.y, width: position.w, height: position.h, transform: 'none', bottom: 'auto' }
    : { position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }

  return (
    <div
      ref={ref}
      onMouseDown={() => onSelect?.()}
      style={{
        ...posStyle,
        zIndex: 30,
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: 0,
        background: 'var(--sp-surface)',
        border: `1px solid ${selected ? 'var(--sp-border-accent)' : 'var(--sp-border)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: selected ? 'var(--sp-shadow-3)' : 'var(--sp-shadow-2)',
        backdropFilter: 'blur(20px)',
        maxWidth: 'calc(100vw - 64px)',
        overflow: 'hidden',
        minWidth: 300,
      }}>
      {/* Header — drag handle in layoutMode */}
      <div
        onMouseDown={(e) => startDrag(e, 'move')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          borderBottom: '1px solid var(--sp-border)',
          cursor: layoutMode ? 'grab' : 'default',
          userSelect: 'none',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sp-zone-hand)', flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--sp-text)' }}>Hand</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)',
          color: 'var(--sp-text-3)', marginLeft: 'auto',
        }}>{cards.length}</span>
      </div>
      <div
        onDragOver={(e) => { if (!layoutMode) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
        onDrop={(e) => { if (!layoutMode) onCardDrop?.(e) }}
        style={{ display: 'flex', gap: 6, overflow: 'auto', padding: 12, flex: 1, minHeight: 80, alignItems: 'flex-start' }}
      >
        {cards.length === 0 ? (
          <div style={{
            width: 320, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--sp-text-3)', fontSize: 'var(--fs-xs)', fontStyle: 'italic',
          }}>empty hand — press ↓ to draw</div>
        ) : cards.map((c, i) => (
          <BigCard
            key={c.instanceId}
            card={c}
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

function BigCard({
  card,
  draggable,
  onClick,
  onContextMenu,
  onDragStart,
  onDrop,
  onHover,
  onHoverEnd,
}: {
  card: DisplayCard
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
        width: 72, height: 100,
        background: card.imageData
          ? `url(${card.imageData}) center/cover no-repeat`
          : 'var(--sp-card-bg)',
        border: `1px solid ${card.titleFg ? card.titleFg + '55' : 'var(--sp-card-border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: card.imageData ? 0 : 6,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transform: hover ? 'translateY(-8px)' : 'none',
        transition: 'transform var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease)',
        cursor: 'pointer', textAlign: 'left',
        boxShadow: hover ? 'var(--sp-shadow-3)' : 'var(--sp-shadow-1)',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {(card.masked || card.faceDown) ? (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--sp-text-3)', letterSpacing: '0.1em',
          background: 'var(--sp-card-bg)',
        }}>TCG</div>
      ) : !card.imageData ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--sp-text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 52 }}>
              {card.name}
            </span>
            {card.cost != null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: card.titleFg || 'var(--sp-text-2)' }}>
                {card.cost}
              </span>
            )}
          </div>
          <div style={{ height: 36, borderRadius: 3, background: card.glow || 'var(--sp-surface-3)', opacity: 0.5 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--sp-text-3)', textTransform: 'uppercase' }}>
            {card.civ}
          </div>
        </>
      ) : null}
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// CommandPalette — ⌘K style modal
// ─────────────────────────────────────────────────────────
export interface PaletteCommand {
  icon?: string; label: string; shortcut?: string; run: () => void
}

interface CommandPaletteProps {
  open: boolean; onClose: () => void; commands: PaletteCommand[]
}

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open && ref.current) ref.current.focus()
    if (!open) setQ('')
  }, [open])
  if (!open) return null
  const filtered = commands.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--sp-overlay)',
      display: 'flex', justifyContent: 'center', paddingTop: '15vh',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, maxWidth: '90vw',
        background: 'var(--sp-surface)',
        border: '1px solid var(--sp-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--sp-shadow-3)',
        overflow: 'hidden',
      }}>
        <input
          ref={ref}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Type a command…"
          style={{
            width: '100%', padding: '14px 18px',
            background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--sp-border)',
            color: 'var(--sp-text)', fontSize: 'var(--fs-body)',
            outline: 'none',
          }}
        />
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--sp-text-3)', fontSize: 'var(--fs-sm)' }}>
              No results
            </div>
          ) : filtered.map((c, i) => (
            <button key={i} onClick={() => { c.run(); onClose() }} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '8px 12px',
              background: 'transparent', border: 'none', borderRadius: 'var(--radius-xs)',
              color: 'var(--sp-text)', fontSize: 'var(--fs-sm)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'background var(--dur-fast) var(--ease)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--sp-surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {c.icon && <span style={{ fontSize: 14, color: 'var(--sp-text-2)' }}>{c.icon}</span>}
              <span style={{ flex: 1 }}>{c.label}</span>
              {c.shortcut && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--sp-text-3)' }}>
                  {c.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Sheet — slide-up panel (deck builder, settings)
// ─────────────────────────────────────────────────────────
interface SheetProps {
  open: boolean; onClose: () => void; title: string
  children?: ReactNode; width?: number
}

export function Sheet({ open, onClose, title, children, width = 720 }: SheetProps) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'var(--sp-overlay)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width, maxWidth: '92vw', maxHeight: '85vh',
        background: 'var(--sp-surface)',
        border: '1px solid var(--sp-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--sp-shadow-3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--sp-border)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h1)', color: 'var(--sp-text)' }}>
            {title}
          </span>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--sp-text-2)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4,
          }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
