import { useUIStore } from '../../store/uiStore'

export interface SidebarItem {
  icon: string
  label: string
  description?: string
  onClick: () => void
}

interface Props {
  items: SidebarItem[]
}

export function BoardSidebar({ items }: Props) {
  const { sidebarOpen, closeSidebar } = useUIStore(s => ({
    sidebarOpen: s.sidebarOpen,
    closeSidebar: s.closeSidebar,
  }))

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 600,
            background: 'rgba(0,0,0,0.45)',
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar pane */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          zIndex: 601,
          background: 'var(--surface)',
          borderRight: '1px solid rgba(var(--purple-rgb),0.4)',
          boxShadow: sidebarOpen ? '4px 0 32px rgba(0,0,0,0.7)' : 'none',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Chakra Petch', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(var(--purple-rgb),0.2)',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: 'var(--purple-lite)',
            textShadow: '0 0 10px rgba(var(--purple-rgb),0.5)',
          }}>
            MENU
          </span>
          <button
            onClick={closeSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { closeSidebar(); item.onClick() }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(var(--purple-rgb),0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--purple-rgb),0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0, width: 24, textAlign: 'center' }}>
                {item.icon}
              </span>
              <div>
                <div style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: 'var(--purple-lite)',
                  marginBottom: item.description ? 4 : 0,
                }}>
                  {item.label}
                </div>
                {item.description && (
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
