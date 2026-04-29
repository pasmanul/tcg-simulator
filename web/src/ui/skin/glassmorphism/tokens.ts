import type { ThemeTokens } from '../types'
import type { ZonePalette } from '../types'
import { hexToRgb } from '../utils'
import { darkCyber } from '../../../theme'

export const glassmorphismTokens: ThemeTokens = {
  bg:         '#0F0F1A',
  bg2:        '#080810',
  surface:    '#0F172A',
  surface2:   '#1E293B',
  purple:     '#6366F1',
  purpleLite: '#A5B4FC',
  cyan:       '#22D3EE',
  pink:       '#F43F5E',
  text:       '#F1F5F9',
  muted:      '#94A3B8',
  border:     '#1E293B',
}

export const glassmorphismCssVars: Record<string, string> = {
  '--bg':          glassmorphismTokens.bg,
  '--bg2':         glassmorphismTokens.bg2,
  '--surface':     glassmorphismTokens.surface,
  '--surface2':    glassmorphismTokens.surface2,
  '--purple':      glassmorphismTokens.purple,
  '--purple-lite': glassmorphismTokens.purpleLite,
  '--cyan':        glassmorphismTokens.cyan,
  '--pink':        glassmorphismTokens.pink,
  '--text':        glassmorphismTokens.text,
  '--muted':       glassmorphismTokens.muted,
  '--border':      glassmorphismTokens.border,
  '--purple-rgb':  hexToRgb(glassmorphismTokens.purple),
  '--cyan-rgb':    hexToRgb(glassmorphismTokens.cyan),
  '--font-body':   "'DM Sans', sans-serif",
  '--font-mono':   "'DM Sans', monospace",
  '--radius':      '12px',
  '--glow':        '0.8',
}

export const glassmorphismCssOverrides = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
`

// インディゴ/シアン系ゾーンパレット [bg, border, text, tapped-bg, tapped-border]
export const glassmorphismZonePalette: ZonePalette = {
  ...darkCyber.zonePalette,
  deck:   ['#0F172A', '#3730A3', '#A5B4FC', '#080810', '#312E81'],
  hand:   ['#0F172A', '#0E7490', '#67E8F9', '#080810', '#155E75'],
  temp:   ['#0F172A', '#1E293B', '#94A3B8', '#080810', '#334155'],
}
