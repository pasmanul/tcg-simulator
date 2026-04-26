import { create } from 'zustand'
import type { WindowDefinition, ZoneDefinition, GameConfigJson } from '../domain/types'
import defaultConfig from '../assets/gameConfig.json'

interface LayoutStore {
  windows: WindowDefinition[]
  zones: ZoneDefinition[]
  getWindowZones: (windowId: string) => ZoneDefinition[]
  getWindow: (windowId: string) => WindowDefinition | undefined
  setConfig: (config: GameConfigJson) => void
  updateZone: (id: string, patch: Partial<ZoneDefinition>) => void
  addZone: (windowId: string) => ZoneDefinition
  removeZone: (id: string) => void
}

export const useLayoutStore = create<LayoutStore>((set, get) => {
  const config = defaultConfig as GameConfigJson
  return {
    windows: config.windows,
    zones: config.zones,
    getWindowZones: (windowId) => get().zones.filter(z => z.window_id === windowId),
    getWindow: (windowId) => get().windows.find(w => w.id === windowId),
    setConfig: (config) => set({ windows: config.windows, zones: config.zones }),
    updateZone: (id, patch) => set(s => ({
      zones: s.zones.map(z => z.id === id ? { ...z, ...patch } : z),
    })),
    addZone: (windowId) => {
      const newZone: ZoneDefinition = {
        id: `zone_${Date.now()}`,
        name: 'New Zone',
        window_id: windowId,
        grid_pos: { col: 0, row: 0, col_span: 3, row_span: 3 },
        visibility: 'public',
        pile_mode: false,
        tappable: false,
        card_scale: 1.0,
        two_row: false,
        masked: false,
      }
      set(s => ({ zones: [...s.zones, newZone] }))
      return newZone
    },
    removeZone: (id) => set(s => ({ zones: s.zones.filter(z => z.id !== id) })),
  }
})
