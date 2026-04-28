import { useTabSync } from '../../sync/useTabSync'
import { useCardHotkeys } from '../hooks/useCardHotkeys'
import { HandStage } from '../stage/HandStage'
import { HandHud } from '../hud/HandHud'
import { ContextMenu } from '../overlays/ContextMenu'
import { GameLoadDialog } from '../overlays/GameLoadDialog'
import { CardZoomOverlay } from '../overlays/CardZoomOverlay'
import { PAGE_STYLE } from '../pageLayout'

export function HandPage() {
  useTabSync('hand')
  useCardHotkeys()

  // initZones は呼ばない — ボードウィンドウが initZones + ダミーデータを管理し
  // BroadcastChannel (PING/PONG) で状態を同期する

  return (
    <div style={PAGE_STYLE}>
      <HandHud />
      <HandStage />
      <ContextMenu />
      <GameLoadDialog />
      <CardZoomOverlay />
    </div>
  )
}
