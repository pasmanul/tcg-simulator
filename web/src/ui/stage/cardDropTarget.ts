import type { ZoneDefinition, WindowDefinition } from '../../domain/types'

export interface CardDropDetail {
  fromZoneId: string
  instanceId: string
  dropX: number
  dropY: number
}

/**
 * Given a drop position and a list of zone definitions, returns the zone id
 * that contains the drop point, or null if none matches.
 */
export function findDropZone(
  dropX: number,
  dropY: number,
  zoneDefs: ZoneDefinition[],
  winDef: WindowDefinition,
  stageWidth: number,
  stageHeight: number,
): string | null {
  const cellW = stageWidth / winDef.grid_cols
  const cellH = stageHeight / winDef.grid_rows

  for (const zd of zoneDefs) {
    if (zd.source_zone_id || zd.ui_widget) continue
    const x = zd.grid_pos.col * cellW
    const y = zd.grid_pos.row * cellH
    const w = zd.grid_pos.col_span * cellW
    const h = zd.grid_pos.row_span * cellH
    if (dropX >= x && dropX <= x + w && dropY >= y && dropY <= y + h) {
      return zd.id
    }
  }
  return null
}
