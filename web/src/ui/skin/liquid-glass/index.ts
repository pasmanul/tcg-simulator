import type { SkinDef } from '../types'
import { liquidGlassTokens, liquidGlassCssVars, liquidGlassCssOverrides, liquidGlassZonePalette } from './tokens'
import { Panel } from './Panel'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Input } from './Input'
import { Select } from './Select'

export const liquidGlassSkin: SkinDef = {
  id: 'liquid-glass',
  name: 'Liquid Glass',
  tokens: liquidGlassTokens,
  zonePalette: liquidGlassZonePalette,
  cssVars: liquidGlassCssVars,
  cssOverrides: liquidGlassCssOverrides,
  components: { Button, Dialog, Input, Select, Panel },
}
