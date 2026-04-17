import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useTabSync } from '../../sync/useTabSync'
import { HandStage } from '../stage/HandStage'
import { HandHud } from '../hud/HandHud'
import { ContextMenu } from '../overlays/ContextMenu'
import { SetupDialog } from '../overlays/SetupDialog'
import { CRT_STYLE, PAGE_STYLE } from '../pageLayout'

export function HandPage() {
  useTabSync('hand')

  const initZones = useGameStore(s => s.initZones)
  const zones = useLayoutStore(s => s.zones)

  useEffect(() => {
    // Only initialize if zones are not yet set up (board tab may have already populated state)
    if (Object.keys(useGameStore.getState().zones).length > 0) return
    const realZoneIds = zones
      .filter(z => !z.source_zone_id && !z.ui_widget)
      .map(z => z.id)
    initZones(realZoneIds)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={PAGE_STYLE}>
      <div style={CRT_STYLE} />
      <HandHud />
      <HandStage />
      <ContextMenu />
      <SetupDialog />
    </div>
  )
}
