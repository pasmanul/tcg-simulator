/** Shared layout constants and styles for page-level components */

export const CRT_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
  pointerEvents: 'none',
  zIndex: 9999,
}

export const PAGE_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  background: '#0F0F23',
  overflow: 'hidden',
}
