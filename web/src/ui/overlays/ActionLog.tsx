import { useUIStore } from '../../store/uiStore'

export function ActionLog() {
  const log = useUIStore(s => s.actionLog)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface2)',
        border: '1px solid rgba(var(--purple-rgb), 0.2)',
        borderRadius: 8,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '5px 10px',
          background: 'var(--surface2)',
          borderBottom: '1px solid rgba(var(--purple-rgb), 0.15)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: 'var(--muted)',
          letterSpacing: 0.5,
          flexShrink: 0,
        }}
      >
        ACTION LOG
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {log.map(entry => (
          <div
            key={entry.id}
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: 11,
              color: 'var(--text)',
              padding: '2px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              lineHeight: 1.4,
            }}
          >
            {entry.message}
          </div>
        ))}
        {log.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 10, fontFamily: "'VT323', monospace", marginTop: 4 }}>
            No actions yet
          </div>
        )}
      </div>
    </div>
  )
}
