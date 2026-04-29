// Temporary stub — wraps existing Retro components as a SkinDef
// Replaced in Phase 5 when retro skin is fully structured.
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Input }  from '../../components/Input'
import { Select } from '../../components/Select'
import { Panel }  from './Panel'
import type { SkinDef } from '../types'
import { darkCyber } from '../../../theme'

export const retroStubSkin: SkinDef = {
  id: 'retro-dark-cyber',
  name: 'Dark Cyber (Retro)',
  tokens: darkCyber.tokens,
  zonePalette: darkCyber.zonePalette,
  cssVars: {
    '--bg':          darkCyber.tokens.bg,
    '--bg2':         darkCyber.tokens.bg2,
    '--surface':     darkCyber.tokens.surface,
    '--surface2':    darkCyber.tokens.surface2,
    '--purple':      darkCyber.tokens.purple,
    '--purple-lite': darkCyber.tokens.purpleLite,
    '--cyan':        darkCyber.tokens.cyan,
    '--pink':        darkCyber.tokens.pink,
    '--text':        darkCyber.tokens.text,
    '--muted':       darkCyber.tokens.muted,
    '--border':      darkCyber.tokens.border,
    '--purple-rgb':  hexToRgb(darkCyber.tokens.purple),
    '--cyan-rgb':    hexToRgb(darkCyber.tokens.cyan),
    '--font-body':   "'Chakra Petch', sans-serif",
    '--font-mono':   "'Press Start 2P', monospace",
    '--radius':      '6px',
    '--glow':        '1',
  },
  components: { Button, Dialog, Input, Select, Panel },
}

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '')
  return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`
}
