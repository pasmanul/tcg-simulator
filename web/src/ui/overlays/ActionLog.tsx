import { useUIStore } from '../../store/uiStore'
import { useSkin } from '../skin/SkinContext'

export function ActionLog() {
  const { Panel } = useSkin()
  const log = useUIStore(s => s.actionLog)

  return (
    <Panel variant="inset" className="flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-2.5 py-1.5 bg-surface2 border-b border-primary/15 font-mono text-[8px] text-muted tracking-wide flex-shrink-0">
        ACTION LOG
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-0.5">
        {log.map(entry => (
          <div
            key={entry.id}
            className="font-body text-[11px] text-text-base py-0.5 border-b border-white/[0.03] leading-snug"
          >
            {entry.message}
          </div>
        ))}
        {log.length === 0 && (
          <p className="text-muted text-[10px] font-mono mt-1">No actions yet</p>
        )}
      </div>
    </Panel>
  )
}
