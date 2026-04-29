import type { ThemeTokens } from '../types'
import type { ZonePalette } from '../types'
import { darkCyber } from '../../../theme'

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '')
  return `${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)}`
}

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

export const liquidGlassZonePalette: ZonePalette = darkCyber.zonePalette
