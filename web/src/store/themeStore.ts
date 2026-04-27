import { create } from 'zustand'
import { THEMES, darkCyber, type Theme } from '../theme'

const STORAGE_KEY = 'tcg-sim-theme'

function applyTheme(theme: Theme) {
  try {
    const r = document.documentElement.style

    // トークン → CSS変数
    r.setProperty('--bg',          theme.tokens.bg)
    r.setProperty('--bg2',         theme.tokens.bg2)
    r.setProperty('--purple',      theme.tokens.purple)
    r.setProperty('--purple-lite', theme.tokens.purpleLite)
    r.setProperty('--cyan',        theme.tokens.cyan)
    r.setProperty('--pink',        theme.tokens.pink)
    r.setProperty('--text',        theme.tokens.text)
    r.setProperty('--muted',       theme.tokens.muted)
    r.setProperty('--border',      theme.tokens.border)

    // スタイルオプション
    r.setProperty('--font-body',   theme.style?.fontBody   ?? "'Chakra Petch', sans-serif")
    r.setProperty('--font-mono',   theme.style?.fontMono   ?? "'Press Start 2P', monospace")
    r.setProperty('--radius',      `${theme.style?.borderRadius ?? 6}px`)
    r.setProperty('--glow',        `${theme.style?.glowIntensity ?? 1}`)

    // cssOverrides注入
    let styleEl = document.getElementById('theme-overrides') as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'theme-overrides'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = theme.cssOverrides ?? ''
  } catch (error) {
    console.error('[ThemeStore] Failed to apply theme:', error)
  }
}

interface ThemeStore {
  currentTheme: Theme
  setTheme: (id: string) => void
  loadSavedTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  currentTheme: darkCyber,

  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id) ?? darkCyber
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, id)
    set({ currentTheme: theme })
  },

  loadSavedTheme: () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && !THEMES.find(t => t.id === saved)) {
      console.warn(`[ThemeStore] Saved theme "${saved}" not found, using default`)
    }
    const theme = (saved ? THEMES.find(t => t.id === saved) : null) ?? darkCyber
    applyTheme(theme)
    set({ currentTheme: theme })
  },
}))
