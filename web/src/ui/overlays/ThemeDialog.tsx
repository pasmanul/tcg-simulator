import { THEMES } from '../../theme'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'

export function ThemeDialog() {
  const activeDialog = useUIStore(s => s.activeDialog)
  const closeDialog = useUIStore(s => s.closeDialog)
  const { currentTheme, setTheme } = useThemeStore(s => ({
    currentTheme: s.currentTheme,
    setTheme: s.setTheme,
  }))

  if (activeDialog !== 'theme') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 700,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={closeDialog}
    >
      <div
        style={{
          background: '#08091e',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 10,
          boxShadow: '0 0 40px rgba(124,58,237,0.3)',
          width: 420,
          maxWidth: '90vw',
          fontFamily: "'Chakra Petch', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(124,58,237,0.2)',
        }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: '#A78BFA',
            textShadow: '0 0 10px rgba(167,139,250,0.5)',
          }}>
            🎨 THEME
          </span>
          <button
            onClick={closeDialog}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#505c78',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}
            aria-label="閉じる"
          >×</button>
        </div>

        {/* Theme grid */}
        <div style={{
          padding: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}>
          {THEMES.map(theme => {
            const isActive = theme.id === currentTheme.id
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                style={{
                  background: isActive ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)',
                  border: isActive
                    ? '2px solid #7C3AED'
                    : '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 120ms',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(124,58,237,0.12)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                {/* Color swatches */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[theme.tokens.bg, theme.tokens.purple, theme.tokens.cyan, theme.tokens.pink].map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        background: color,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
                {/* Name */}
                <div style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 7,
                  color: isActive ? '#c4b5fd' : '#8899bb',
                  marginBottom: isActive ? 4 : 0,
                }}>
                  {theme.name}
                </div>
                {isActive && (
                  <div style={{ fontSize: 9, color: '#7C3AED' }}>✓ 選択中</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
