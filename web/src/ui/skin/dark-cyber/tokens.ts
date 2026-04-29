import type { ThemeTokens, ZonePalette } from '../types'
import { darkCyber } from '../../../theme'
import { hexToRgb } from '../utils'

export const darkCyberTokens: ThemeTokens = darkCyber.tokens

export const darkCyberCssVars: Record<string, string> = {
  '--bg':          darkCyberTokens.bg,
  '--bg2':         darkCyberTokens.bg2,
  '--surface':     darkCyberTokens.surface,
  '--surface2':    darkCyberTokens.surface2,
  '--purple':      darkCyberTokens.purple,
  '--purple-lite': darkCyberTokens.purpleLite,
  '--cyan':        darkCyberTokens.cyan,
  '--pink':        darkCyberTokens.pink,
  '--text':        darkCyberTokens.text,
  '--muted':       darkCyberTokens.muted,
  '--border':      darkCyberTokens.border,
  '--purple-rgb':  hexToRgb(darkCyberTokens.purple),
  '--cyan-rgb':    hexToRgb(darkCyberTokens.cyan),
  '--font-body':   "'Chakra Petch', 'Inter', sans-serif",
  '--font-mono':   "'JetBrains Mono', monospace",
  '--radius':      '6px',
  '--glow':        '1.0',
}

export const darkCyberCssOverrides = `
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

body {
  background-image:
    radial-gradient(ellipse at top left, rgba(124,58,237,0.08) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(0,255,255,0.04) 0%, transparent 50%);
}
`

export const darkCyberZonePalette: ZonePalette = darkCyber.zonePalette
