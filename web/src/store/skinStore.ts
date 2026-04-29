import { create } from 'zustand'
import type { SkinDef } from '../ui/skin/types'
import { SKINS, defaultSkin } from '../ui/skin'

const STORAGE_KEY = 'tcg-sim-skin'

function applySkin(skin: SkinDef) {
  try {
    const r = document.documentElement.style
    for (const [key, value] of Object.entries(skin.cssVars)) {
      r.setProperty(key, value)
    }

    let styleEl = document.getElementById('skin-overrides') as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'skin-overrides'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = skin.cssOverrides ?? ''
  } catch (error) {
    console.error('[SkinStore] Failed to apply skin:', error)
  }
}

interface SkinStore {
  currentSkin: SkinDef
  setSkin: (id: string) => void
  loadSavedSkin: () => void
}

export const useSkinStore = create<SkinStore>((set) => ({
  currentSkin: defaultSkin,

  setSkin: (id) => {
    const skin = SKINS.find(s => s.id === id) ?? defaultSkin
    applySkin(skin)
    localStorage.setItem(STORAGE_KEY, id)
    set({ currentSkin: skin })
  },

  loadSavedSkin: () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && !SKINS.find(s => s.id === saved)) {
      console.warn(`[SkinStore] Saved skin "${saved}" not found, using default`)
    }
    const skin = (saved ? SKINS.find(s => s.id === saved) : null) ?? defaultSkin
    applySkin(skin)
    set({ currentSkin: skin })
  },
}))
