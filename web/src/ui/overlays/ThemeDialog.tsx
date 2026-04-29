import { SKINS } from '../../ui/skin'
import { useSkinStore } from '../../store/skinStore'
import { useUIStore } from '../../store/uiStore'
import { useSkin } from '../skin/SkinContext'

export function ThemeDialog() {
  const { Dialog } = useSkin()
  const activeDialog = useUIStore(s => s.activeDialog)
  const closeDialog = useUIStore(s => s.closeDialog)
  const { currentSkin, setSkin } = useSkinStore(s => ({
    currentSkin: s.currentSkin,
    setSkin: s.setSkin,
  }))

  return (
    <Dialog
      open={activeDialog === 'theme'}
      onClose={closeDialog}
      title="🎨 SKIN"
      width="max-w-sm"
    >
      <div className="grid grid-cols-2 gap-2.5">
        {SKINS.map(skin => {
          const isActive = skin.id === currentSkin.id
          return (
            <button
              key={skin.id}
              onClick={() => setSkin(skin.id)}
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
                {[skin.tokens.bg, skin.tokens.purple, skin.tokens.cyan, skin.tokens.pink].map((color, i) => (
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
                {skin.name}
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
