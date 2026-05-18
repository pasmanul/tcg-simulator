/* global React */
const { useState, useRef, useEffect, useCallback } = React;

/* ─────────────────────────────────────────────────────────
   ZoneBox — draggable, resizable zone container.
   Position is owned by parent (controlled). Layout state
   is meant to live in GameProfile JSON in production.
   ───────────────────────────────────────────────────────── */
function ZoneBox({
  id, x, y, w, h, title, accent,
  cards = [], variant = 'tiles', // 'tiles' | 'pile' | 'list'
  selected, onSelect, onMove, onResize, onCardClick,
  layoutMode, headerExtras,
}) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);

  const startDrag = (e, mode = 'move') => {
    if (!layoutMode && mode === 'move') return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(id);
    const startX = e.clientX, startY = e.clientY;
    const start = { x, y, w, h };
    const onMouseMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (mode === 'move') onMove?.(id, start.x + dx, start.y + dy);
      else onResize?.(id, Math.max(220, start.w + dx), Math.max(140, start.h + dy));
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h,
        background: 'var(--surface)',
        border: `1px solid ${selected ? 'var(--border-accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: selected ? 'var(--shadow-3)' : 'var(--shadow-2)',
        transition: drag ? 'none' : 'box-shadow var(--dur-base) var(--ease)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
      onMouseDown={() => onSelect?.(id)}
    >
      {/* Header */}
      <div
        onMouseDown={(e) => startDrag(e, 'move')}
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          cursor: layoutMode ? 'grab' : 'default',
          userSelect: 'none',
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: accent || 'var(--text-3)',
        }} />
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--text)' }}>
          {title}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--text-3)', marginLeft: 'auto' }}>
          {cards.length}
        </span>
        {headerExtras}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: 'var(--space-3)', overflow: 'hidden' }}>
        {variant === 'pile' && (
          <PileView cards={cards} accent={accent} />
        )}
        {variant === 'tiles' && (
          <TilesView cards={cards} onCardClick={onCardClick} />
        )}
        {variant === 'list' && (
          <ListView cards={cards} onCardClick={onCardClick} />
        )}
      </div>

      {/* Resize handle (layout mode only) */}
      {layoutMode && (
        <div
          onMouseDown={(e) => startDrag(e, 'resize')}
          style={{
            position: 'absolute', right: 0, bottom: 0,
            width: 16, height: 16, cursor: 'nwse-resize',
            background: 'linear-gradient(135deg, transparent 50%, var(--border-strong) 50%, var(--border-strong) 60%, transparent 60%, transparent 70%, var(--border-strong) 70%, var(--border-strong) 80%, transparent 80%)',
          }}
        />
      )}
    </div>
  );
}

function PileView({ cards, accent }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 112 }}>
        {cards.length > 0 && [...Array(Math.min(3, cards.length))].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            transform: `translate(${i * 1.5}px, ${-i * 1.5}px)`,
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-1)',
          }} />
        ))}
        {cards.length > 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-2)',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, color: accent || 'var(--text)',
              lineHeight: 1,
            }}>{cards.length}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)',
              color: 'var(--text-3)', marginTop: 4, letterSpacing: '0.08em',
            }}>CARDS</div>
          </div>
        )}
        {cards.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-3)', fontSize: 'var(--fs-xs)',
          }}>empty</div>
        )}
      </div>
    </div>
  );
}

function TilesView({ cards, onCardClick }) {
  if (cards.length === 0) {
    return <EmptyHint label="drag cards here" />;
  }
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6,
      alignContent: 'flex-start', height: '100%', overflow: 'auto',
    }}>
      {cards.map((c, i) => (
        <MiniCard key={c.iid || i} card={c} onClick={() => onCardClick?.(c, i)} />
      ))}
    </div>
  );
}

function ListView({ cards, onCardClick }) {
  if (cards.length === 0) return <EmptyHint label="—" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
      {cards.map((c, i) => (
        <button key={c.iid || i} onClick={() => onCardClick?.(c, i)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 8px',
          background: 'transparent', border: 'none',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--text)', fontSize: 'var(--fs-sm)',
          textAlign: 'left',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: c.titleFg || 'var(--text-3)' }} />
          <span style={{ flex: 1 }}>{c.masked ? '?' : c.name}</span>
          {!c.masked && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--text-3)' }}>{c.cost}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function EmptyHint({ label }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-3)', fontSize: 'var(--fs-xs)',
      fontStyle: 'italic',
    }}>{label}</div>
  );
}

function MiniCard({ card, onClick }) {
  const tapped = card.tapped;
  return (
    <button onClick={onClick} style={{
      width: 56, height: 78,
      background: 'var(--card-bg)',
      border: `1px solid ${card.titleFg ? card.titleFg + '55' : 'var(--card-border)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: 5,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      transform: tapped ? 'rotate(90deg)' : 'none',
      transition: 'transform var(--dur-base) var(--ease)',
      cursor: 'pointer', textAlign: 'left',
      boxShadow: 'var(--shadow-1)',
      flexShrink: 0,
    }}>
      {card.masked || card.faceDown ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-3)', letterSpacing: '0.1em',
        }}>TCG</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--text)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {card.name}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: card.titleFg || 'var(--text-2)', flexShrink: 0 }}>
              {card.cost}
            </span>
          </div>
          <div style={{
            height: 28, borderRadius: 3,
            background: card.glow || 'var(--surface-3)',
            opacity: 0.5,
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-3)', textTransform: 'uppercase' }}>
            {card.civ}
          </div>
        </>
      )}
    </button>
  );
}

window.ZoneBox = ZoneBox;
window.MiniCard = MiniCard;
