/* global React */
const { useState: us, useEffect: ue, useRef: ur } = React;

/* ─────────────────────────────────────────────────────────
   FloatingToolbar — top-center, semi-transparent.
   ───────────────────────────────────────────────────────── */
function FloatingToolbar({ onInit, onDraw, onUndo, onDice, onSave, onLoad, onMenu, layoutMode, onToggleLayout }) {
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 4,
      padding: 6,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-2)',
      backdropFilter: 'blur(20px)',
    }}>
      <TBButton onClick={onMenu} icon="☰" label="Menu" />
      <Divider />
      <TBButton onClick={onInit} icon="◐" label="New game" primary />
      <TBButton onClick={onDraw} icon="↓" label="Draw" />
      <TBButton onClick={onUndo} icon="↶" label="Undo" />
      <Divider />
      <TBButton onClick={onDice} icon="⚂" label="Dice" />
      <TBButton onClick={onSave} icon="◇" label="Save" />
      <TBButton onClick={onLoad} icon="◈" label="Load" />
      <Divider />
      <TBButton
        onClick={onToggleLayout}
        icon={layoutMode ? '✓' : '⊞'}
        label={layoutMode ? 'Done' : 'Edit layout'}
        active={layoutMode}
      />
    </div>
  );
}

function TBButton({ onClick, icon, label, primary, active }) {
  const [hover, setHover] = us(false);
  const bg = active ? 'var(--accent-soft)' :
             primary ? 'var(--accent)' :
             hover ? 'var(--surface-2)' : 'transparent';
  const fg = active ? 'var(--accent)' :
             primary ? 'var(--text-on-accent)' :
             'var(--text)';
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
  );
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />;
}

/* ─────────────────────────────────────────────────────────
   LayersPanel — left-floating, list of zones with vis toggles.
   ───────────────────────────────────────────────────────── */
function LayersPanel({ zones, selected, onSelect, onToggleVis, onAddZone, layoutMode }) {
  return (
    <div style={{
      position: 'absolute', left: 16, top: 80, zIndex: 40,
      width: 220,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-2)',
      padding: 8,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 8px 8px',
      }}>
        <span style={{ fontSize: 'var(--fs-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Zones
        </span>
        {layoutMode && (
          <button onClick={onAddZone} title="Add zone" style={{
            background: 'transparent', border: 'none', color: 'var(--text-2)',
            fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1,
          }}>+</button>
        )}
      </div>
      {zones.map(z => (
        <button key={z.id} onClick={() => onSelect(z.id)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '6px 8px',
          background: selected === z.id ? 'var(--accent-soft)' : 'transparent',
          border: 'none', borderRadius: 'var(--radius-xs)',
          color: 'var(--text)', fontSize: 'var(--fs-sm)',
          cursor: 'pointer', textAlign: 'left',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.accent, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{z.title}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--text-3)' }}>
            {z.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   InspectorPanel — right-floating, layout-mode-only.
   Shows position/size of selected zone.
   ───────────────────────────────────────────────────────── */
function InspectorPanel({ zone, onUpdate, onClose }) {
  if (!zone) return null;
  return (
    <div style={{
      position: 'absolute', right: 16, top: 80, zIndex: 40,
      width: 240,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-2)',
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 'var(--fs-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Zone · {zone.title}
        </span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <NumField label="X" value={zone.x} onChange={v => onUpdate({ x: v })} />
        <NumField label="Y" value={zone.y} onChange={v => onUpdate({ y: v })} />
        <NumField label="W" value={zone.w} onChange={v => onUpdate({ w: v })} />
        <NumField label="H" value={zone.h} onChange={v => onUpdate({ h: v })} />
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--fs-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xs)', padding: '4px 6px',
          fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-mono)',
          color: 'var(--text)', width: '100%', outline: 'none',
        }}
      />
    </label>
  );
}

/* ─────────────────────────────────────────────────────────
   HandDock — bottom of screen, persistent
   ───────────────────────────────────────────────────────── */
function HandDock({ cards, onCardClick }) {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 30,
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: 12,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-3)',
      backdropFilter: 'blur(20px)',
      maxWidth: 'calc(100vw - 64px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--zone-hand)' }} />
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>Hand</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--text-3)', marginLeft: 'auto' }}>
          {cards.length}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, minHeight: 100 }}>
        {cards.length === 0 ? (
          <div style={{ width: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 'var(--fs-xs)', fontStyle: 'italic' }}>
            empty hand — press ↓ to draw
          </div>
        ) : cards.map((c, i) => (
          <BigCard key={c.iid || i} card={c} onClick={() => onCardClick?.(c, i)} />
        ))}
      </div>
    </div>
  );
}

function BigCard({ card, onClick }) {
  const [hover, setHover] = us(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 72, height: 100,
        background: 'var(--card-bg)',
        border: `1px solid ${card.titleFg ? card.titleFg + '55' : 'var(--card-border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: 6,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transform: hover ? 'translateY(-6px)' : 'none',
        transition: 'transform var(--dur-base) var(--ease)',
        cursor: 'pointer', textAlign: 'left',
        boxShadow: hover ? 'var(--shadow-3)' : 'var(--shadow-1)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 50 }}>
          {card.name}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: card.titleFg || 'var(--text-2)' }}>{card.cost}</span>
      </div>
      <div style={{ height: 36, borderRadius: 3, background: card.glow || 'var(--surface-3)', opacity: 0.5 }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-3)', textTransform: 'uppercase' }}>
        {card.civ}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   CommandPalette — ⌘K-style modal
   ───────────────────────────────────────────────────────── */
function CommandPalette({ open, onClose, commands }) {
  const [q, setQ] = us('');
  const ref = ur(null);
  ue(() => { if (open && ref.current) ref.current.focus(); if (!open) setQ(''); }, [open]);
  if (!open) return null;
  const filtered = commands.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--overlay)',
      display: 'flex', justifyContent: 'center', paddingTop: '15vh',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, maxWidth: '90vw', height: 'fit-content',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-3)',
        overflow: 'hidden',
      }}>
        <input
          ref={ref}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Type a command…"
          style={{
            width: '100%', padding: '14px 18px',
            background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 'var(--fs-body)',
            outline: 'none',
          }}
        />
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--fs-sm)' }}>
              No results
            </div>
          ) : filtered.map((c, i) => (
            <button key={i} onClick={() => { c.run(); onClose(); }} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '8px 12px',
              background: 'transparent', border: 'none', borderRadius: 'var(--radius-xs)',
              color: 'var(--text)', fontSize: 'var(--fs-sm)',
              cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{c.icon}</span>
              <span style={{ flex: 1 }}>{c.label}</span>
              {c.shortcut && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', color: 'var(--text-3)' }}>{c.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sheet — slide-up panel for dialogs (deck builder, settings)
   ───────────────────────────────────────────────────────── */
function Sheet({ open, onClose, title, children, width = 720 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'var(--overlay)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width, maxWidth: '92vw', maxHeight: '85vh',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h1)' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-2)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4,
          }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

window.FloatingToolbar = FloatingToolbar;
window.LayersPanel = LayersPanel;
window.InspectorPanel = InspectorPanel;
window.HandDock = HandDock;
window.CommandPalette = CommandPalette;
window.Sheet = Sheet;
