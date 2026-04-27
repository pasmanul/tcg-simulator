// Ported from ui/theme.py — civilization color palette

export interface ThemeTokens {
  bg: string
  bg2: string
  surface: string   // パネル・ダイアログ背景
  surface2: string  // 深ネスト背景（input, list等）
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
    surface:    '#08091e',
    surface2:   '#060814',
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
    surface:    '#120406',
    surface2:   '#0a0203',
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

export const neonArcade: Theme = {
  id: 'neon-arcade',
  name: 'Neon Arcade',
  tokens: {
    bg:         '#050010',
    bg2:        '#020008',
    surface:    '#080018',
    surface2:   '#04000e',
    purple:     '#FF00FF',
    purpleLite: '#FF66FF',
    cyan:       '#00FF41',
    pink:       '#FFFF00',
    text:       '#E8FFE8',
    muted:      '#506050',
    border:     'rgba(255,0,255,0.40)',
  },
  zonePalette: {
    battle:    ['#1a0010', '#0d0008', '#ff0066', '#ff66aa', '#220014'],
    mana:      ['#001800', '#000c00', '#00cc44', '#00ff66', '#001600'],
    shield:    ['#001818', '#000c0c', '#00bbcc', '#00eeff', '#001616'],
    graveyard: ['#100010', '#080008', '#cc00cc', '#ff44ff', '#140014'],
    deck:      ['#080818', '#04040c', '#4444ff', '#8888ff', '#060616'],
    hand:      ['#181000', '#0c0800', '#cc8800', '#ffcc44', '#160e00'],
    temp:      ['#080808', '#040404', '#448844', '#77bb77', '#060606'],
  },
  style: {
    fontBody:      "'VT323', 'Courier New', monospace",
    fontMono:      "'Press Start 2P', monospace",
    borderRadius:  2,
    glowIntensity: 1.8,
  },
  cssOverrides: `
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

@keyframes neon-scanline {
  0%   { top: -4px; opacity: 0.8; }
  100% { top: 100vh; opacity: 0.3; }
}

@keyframes neon-flicker {
  0%, 92%, 100% { opacity: 1; }
  93%            { opacity: 0.85; }
  94%            { opacity: 1; }
  97%            { opacity: 0.7; }
  98%            { opacity: 1; }
}

@keyframes border-pulse {
  0%, 100% { box-shadow: 0 0 6px rgba(255,0,255,0.4); }
  50%       { box-shadow: 0 0 18px rgba(255,0,255,0.9), 0 0 6px rgba(0,255,65,0.4); }
}

body::before {
  content: '';
  position: fixed;
  left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(0,255,65,0.6), rgba(255,0,255,0.6), transparent);
  animation: neon-scanline 4s linear infinite;
  pointer-events: none;
  z-index: 10000;
}

body {
  animation: neon-flicker 10s infinite;
}

canvas {
  filter: contrast(1.08) brightness(1.02) saturate(1.3) !important;
}
`,
}

export const softPaper: Theme = {
  id: 'soft-paper',
  name: 'Soft Paper',
  tokens: {
    bg:         '#F5F0E8',
    bg2:        '#EDE8DC',
    surface:    '#FFFFFF',
    surface2:   '#F0EBE1',
    purple:     '#5B6AF0',
    purpleLite: '#8B96F7',
    cyan:       '#0EA5A0',
    pink:       '#E0516B',
    text:       '#1A1A2E',
    muted:      '#6B7280',
    border:     'rgba(91,106,240,0.20)',
  },
  zonePalette: {
    battle:    ['#fdf0f0', '#fae8e8', '#dc4444', '#ff8080', '#f9dede'],
    mana:      ['#f0f8f0', '#e8f5e8', '#2e8b57', '#4caf50', '#dff0df'],
    shield:    ['#f0f4ff', '#e8eeff', '#4a6fdc', '#7a9fff', '#dde8ff'],
    graveyard: ['#f8f0f8', '#f4e8f4', '#8b4fa8', '#c080dc', '#f0dff0'],
    deck:      ['#f0f8ff', '#e8f2ff', '#2563eb', '#60a5fa', '#dceeff'],
    hand:      ['#f0faf8', '#e8f8f4', '#0d9488', '#34d399', '#dcf8f2'],
    temp:      ['#f4f4f4', '#ebebeb', '#8080a0', '#a0a0c0', '#e8e8ec'],
  },
  style: {
    fontBody:      "'Inter', 'Noto Sans JP', sans-serif",
    fontMono:      "'JetBrains Mono', 'Fira Code', monospace",
    borderRadius:  10,
    glowIntensity: 0.2,
  },
  cssOverrides: `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

body {
  background-image:
    radial-gradient(ellipse at 20% 10%, rgba(91,106,240,0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 90%, rgba(14,165,160,0.05) 0%, transparent 50%);
}
`,
}

export const THEMES: Theme[] = [darkCyber, crimsonCourt, neonArcade, softPaper]

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
