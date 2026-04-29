import type { SkinDef } from '../types'
import { glassmorphismTokens, glassmorphismCssVars, glassmorphismCssOverrides, glassmorphismZonePalette } from './tokens'
import { Panel } from './Panel'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Input } from './Input'
import { Select } from './Select'

export const glassmorphismSkin: SkinDef = {
  id: 'glassmorphism',
  name: 'Glassmorphism Dark',
  tokens: glassmorphismTokens,
  zonePalette: glassmorphismZonePalette,
  cssVars: glassmorphismCssVars,
  cssOverrides: glassmorphismCssOverrides,
  components: { Button, Dialog, Input, Select, Panel },
}
