// Ported from ui/theme.py — civilization color palette

export interface ThemeTokens {
  bg: string
  bg2: string
  purple: string
  purpleLite: string
  cyan: string
  pink: string
  text: string
  muted: string
  border: string
}

export interface ThemeStyle {
  fontBody?: string
  fontMono?: string
  borderRadius?: number
  glowIntensity?: number
  cardAspect?: number
}

export interface Theme {
  id: string
  name: string
  tokens: ThemeTokens
  zonePalette: Record<string, [string, string, string, string, string]>
  style?: ThemeStyle
  cssOverrides?: string
}

export const darkCyber: Theme = {
  id: 'dark-cyber',
  name: 'Dark Cyber',
  tokens: {
    bg:         '#0F0F23',
    bg2:        '#080818',
    purple:     '#7C3AED',
    purpleLite: '#A78BFA',
    cyan:       '#00FFFF',
    pink:       '#FF006E',
    text:       '#E2E8F0',
    muted:      '#94A3B8',
    border:     'rgba(124,58,237,0.30)',
  },
  zonePalette: {
    battle:    ['#1e0a0b', '#0d0506', '#c82030', '#ff8090', '#2c0a10'],
    mana:      ['#081c0c', '#040e06', '#28a848', '#66dd88', '#082214'],
    shield:    ['#1c1608', '#0e0b04', '#c89420', '#ffdd66', '#221c06'],
    graveyard: ['#120818', '#09040e', '#8820b8', '#cc66ee', '#1a0a28'],
    deck:      ['#061420', '#03080e', '#1880c8', '#44aaff', '#041020'],
    hand:      ['#061a1a', '#030e0e', '#20a8b0', '#55ddee', '#041818'],
    temp:      ['#0c1018', '#080c12', '#505c78', '#8899bb', '#0a0e18'],
  },
}

export const crimsonCourt: Theme = {
  id: 'crimson-court',
  name: 'Crimson Court',
  tokens: {
    bg:         '#180808',
    bg2:        '#0d0404',
    purple:     '#C41E3A',
    purpleLite: '#E8607A',
    cyan:       '#D4AF37',
    pink:       '#FF6B35',
    text:       '#F5E6D3',
    muted:      '#8B7355',
    border:     'rgba(196,30,58,0.35)',
  },
  zonePalette: {
    battle:    ['#2a0808', '#160404', '#c41e3a', '#e8607a', '#3a0a0a'],
    mana:      ['#1a1408', '#0d0a04', '#a07828', '#d4af37', '#221a08'],
    shield:    ['#0a1020', '#050810', '#2a5098', '#5a8fdd', '#0a1428'],
    graveyard: ['#160a1a', '#0b0510', '#6b1e8a', '#b066cc', '#1e0a28'],
    deck:      ['#0a1a0a', '#050d05', '#2a6b2a', '#5abf5a', '#081408'],
    hand:      ['#1a1208', '#0d0904', '#8b4513', '#cd8a3f', '#201408'],
    temp:      ['#161010', '#0c0808', '#6b5050', '#9b8080', '#120c0c'],
  },
  style: {
    fontBody:      "'Cinzel', 'Georgia', serif",
    borderRadius:  4,
    glowIntensity: 0.6,
  },
  cssOverrides: `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
body {
  background-image: radial-gradient(ellipse at top left, rgba(196,30,58,0.06) 0%, transparent 60%),
                    radial-gradient(ellipse at bottom right, rgba(212,175,55,0.04) 0%, transparent 60%);
}
`,
}

export const THEMES: Theme[] = [darkCyber, crimsonCourt]

// --- 後方互換：既存コードが直接インポートしているものを維持 ---

export interface ZoneColors {
  bgTop: string
  bgBottom: string
  border: string
  titleFg: string
  titleBar: string
}

/** @deprecated themeStore経由でzonePaletteを使うこと */
export function zoneColors(zoneId: string, zonePalette?: Theme['zonePalette']): ZoneColors {
  const palette = zonePalette ?? darkCyber.zonePalette
  const t = palette[zoneId] ?? palette['temp'] ?? darkCyber.zonePalette['temp']
  return { bgTop: t[0], bgBottom: t[1], border: t[2], titleFg: t[3], titleBar: t[4] }
}

/** @deprecated themeStore.currentTheme.tokensを使うこと */
export const TOKENS = darkCyber.tokens

export const CARD_W = 150
export const CARD_H = 210
