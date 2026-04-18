import { create } from 'zustand'
import type { WindowDefinition, ZoneDefinition, GameConfigJson } from '../domain/types'
import defaultConfig from '../assets/gameConfig.json'

interface LayoutStore {
  windows: WindowDefinition[]
  zones: ZoneDefinition[]
  getWindowZones: (windowId: string) => ZoneDefinition[]
  getWindow: (windowId: string) => WindowDefinition | undefined
  setConfig: (config: GameConfigJson) => void
}

export const useLayoutStore = create<LayoutStore>((set, get) => {
  const config = defaultConfig as GameConfigJson
  return {
    windows: config.windows,
    zones: config.zones,
    getWindowZones: (windowId) => get().zones.filter(z => z.window_id === windowId),
    getWindow: (windowId) => get().windows.find(w => w.id === windowId),
    setConfig: (config) => set({ windows: config.windows, zones: config.zones }),
  }
})
