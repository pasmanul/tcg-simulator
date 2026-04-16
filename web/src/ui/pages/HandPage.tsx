import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useTabSync } from '../../sync/useTabSync'
import { HandStage } from '../stage/HandStage'
import { HandHud } from '../hud/HandHud'
import { ContextMenu } from '../overlays/ContextMenu'
import { SetupDialog } from '../overlays/SetupDialog'

const CRT_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
  pointerEvents: 'none',
  zIndex: 9999,
}

export function HandPage() {
  useTabSync('hand')

  const initZones = useGameStore(s => s.initZones)
  const zones = useLayoutStore(s => s.zones)

  useEffect(() => {
    // Initialize all real zones (state is shared via BroadcastChannel with board tab)
    const realZoneIds = zones
      .filter(z => !z.source_zone_id && !z.ui_widget)
      .map(z => z.id)
    initZones(realZoneIds)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#0F0F23',
      overflow: 'hidden',
    }}>
      <div style={CRT_STYLE} />
      <HandHud />
      <HandStage />
      <ContextMenu />
      <SetupDialog />
    </div>
  )
}
