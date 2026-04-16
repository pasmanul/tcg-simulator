import { useUIStore } from '../../store/uiStore'

export function ActionLog() {
  const log = useUIStore(s => s.actionLog)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#06080e',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 8,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '5px 10px',
          background: '#0a0e1a',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: '#505c78',
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
              color: '#8899bb',
              padding: '2px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              lineHeight: 1.4,
            }}
          >
            {entry.message}
          </div>
        ))}
        {log.length === 0 && (
          <div style={{ color: '#3a4060', fontSize: 10, fontFamily: "'VT323', monospace", marginTop: 4 }}>
            No actions yet
          </div>
        )}
      </div>
    </div>
  )
}
