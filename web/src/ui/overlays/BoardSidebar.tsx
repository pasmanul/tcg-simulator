import { useUIStore } from '../../store/uiStore'
import { useSkin } from '../skin/SkinContext'


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
  const { Button, Panel } = useSkin()
  const { sidebarOpen, closeSidebar } = useUIStore(s => ({
    sidebarOpen: s.sidebarOpen,
    closeSidebar: s.closeSidebar,
  }))

  return (
    <>
      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[600] bg-black/45"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar pane */}
      <Panel
        variant="default"
        className={`fixed top-0 left-0 bottom-0 w-60 z-[601] flex flex-col font-body transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] !rounded-none !border-t-0 !border-b-0 !border-l-0
          ${sidebarOpen ? 'translate-x-0 shadow-[4px_0_32px_rgba(0,0,0,0.7)]' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-primary/20 flex-shrink-0">
          <span className="font-mono text-[9px] text-primary-lite" style={{ textShadow: '0 0 10px rgba(var(--purple-rgb),0.5)' }}>
            MENU
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeSidebar}
            aria-label="閉じる"
            className="text-lg leading-none px-1 py-0"
          >
            ×
          </Button>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-2">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { closeSidebar(); item.onClick() }}
              className="flex items-start gap-3 w-full px-4 py-3 bg-transparent border-0 border-b border-primary/8 cursor-pointer text-left transition-colors duration-[120ms] hover:bg-primary/12"
            >
              <span className="text-lg leading-tight flex-shrink-0 w-6 text-center">
                {item.icon}
              </span>
              <div>
                <div className={`font-mono text-[8px] text-primary-lite${item.description ? ' mb-1' : ''}`}>
                  {item.label}
                </div>
                {item.description && (
                  <div className="text-[10px] text-muted font-body">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </Panel>
    </>
  )
}
