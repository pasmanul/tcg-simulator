import { create } from 'zustand'
import type { WindowDefinition, ZoneDefinition, GameConfigJson } from '../domain/types'
import defaultConfig from '../assets/gameConfig.json'

interface LayoutStore {
  windows: WindowDefinition[]
  zones: ZoneDefinition[]
  getWindowZones: (windowId: string) => ZoneDefinition[]
  getWindow: (windowId: string) => WindowDefinition | undefined
}

export const useLayoutStore = create<LayoutStore>(() => {
  const config = defaultConfig as GameConfigJson
  return {
    windows: config.windows,
    zones: config.zones,
    getWindowZones: (windowId) => config.zones.filter(z => z.window_id === windowId),
    getWindow: (windowId) => config.windows.find(w => w.id === windowId),
  }
})
