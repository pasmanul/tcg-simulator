import type { ThemeTokens } from '../types'
import type { ZonePalette } from '../types'
import { hexToRgb } from '../utils'
import { darkCyber } from '../../../theme'

export const liquidGlassTokens: ThemeTokens = {
  bg:         '#1C1917',
  bg2:        '#0C0A09',
  surface:    '#1C1917',
  surface2:   '#292524',
  purple:     '#CA8A04',
  purpleLite: '#FCD34D',
  cyan:       '#D97706',
  pink:       '#DC2626',
  text:       '#F5F5F4',
  muted:      '#A8A29E',
  border:     '#44403C',
}

export const liquidGlassCssVars: Record<string, string> = {
  '--bg':          liquidGlassTokens.bg,
  '--bg2':         liquidGlassTokens.bg2,
  '--surface':     liquidGlassTokens.surface,
  '--surface2':    liquidGlassTokens.surface2,
  '--purple':      liquidGlassTokens.purple,
  '--purple-lite': liquidGlassTokens.purpleLite,
  '--cyan':        liquidGlassTokens.cyan,
  '--pink':        liquidGlassTokens.pink,
  '--text':        liquidGlassTokens.text,
  '--muted':       liquidGlassTokens.muted,
  '--border':      liquidGlassTokens.border,
  '--purple-rgb':  hexToRgb(liquidGlassTokens.purple),
  '--cyan-rgb':    hexToRgb(liquidGlassTokens.cyan),
  '--font-body':   "'Inter', sans-serif",
  '--font-mono':   "'Inter', monospace",
  '--radius':      '8px',
  '--glow':        '0.6',
}

export const liquidGlassCssOverrides = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
`

// ウォームゴールド系ゾーンパレット [bg, border, text, tapped-bg, tapped-border]
export const liquidGlassZonePalette: ZonePalette = {
  ...darkCyber.zonePalette,
  deck:   ['#1C1917', '#92400E', '#FCD34D', '#0C0A09', '#78350F'],
  hand:   ['#1C1917', '#78350F', '#FCD34D', '#0C0A09', '#92400E'],
  temp:   ['#1C1917', '#44403C', '#D6D3D1', '#0C0A09', '#57534E'],
}
