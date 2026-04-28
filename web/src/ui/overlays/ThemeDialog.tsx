import { THEMES } from '../../theme'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'
import { Dialog } from '../components/Dialog'

export function ThemeDialog() {
  const activeDialog = useUIStore(s => s.activeDialog)
  const closeDialog = useUIStore(s => s.closeDialog)
  const { currentTheme, setTheme } = useThemeStore(s => ({
    currentTheme: s.currentTheme,
    setTheme: s.setTheme,
  }))

  return (
    <Dialog
      open={activeDialog === 'theme'}
      onClose={closeDialog}
      title="🎨 THEME"
      width="max-w-sm"
    >
      {/* Theme grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {THEMES.map(theme => {
          const isActive = theme.id === currentTheme.id
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className="rounded-lg p-2.5 text-left cursor-pointer transition-all duration-[120ms]"
              style={{
                background: isActive ? 'rgba(var(--purple-rgb),0.25)' : 'rgba(255,255,255,0.03)',
                border: isActive
                  ? '2px solid var(--purple)'
                  : '1px solid rgba(var(--purple-rgb),0.2)',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(var(--purple-rgb),0.12)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
            >
              {/* Color swatches */}
              <div className="flex gap-1 mb-2">
                {[theme.tokens.bg, theme.tokens.purple, theme.tokens.cyan, theme.tokens.pink].map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-[3px]"
                    style={{
                      background: color,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                ))}
              </div>

              {/* Name */}
              <div
                className="font-mono text-[7px]"
                style={{
                  color: isActive ? 'var(--purple-lite, #c4b5fd)' : 'var(--muted, #8899bb)',
                  marginBottom: isActive ? 4 : 0,
                }}
              >
                {theme.name}
              </div>

              {isActive && (
                <div className="text-[9px]" style={{ color: 'var(--purple, #7C3AED)' }}>
                  ✓ 選択中
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Dialog>
  )
}
