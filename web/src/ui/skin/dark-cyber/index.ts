import type { SkinDef } from '../types'
import { darkCyberTokens, darkCyberCssVars, darkCyberCssOverrides, darkCyberZonePalette } from './tokens'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Input } from './Input'
import { Select } from './Select'
import { Panel } from './Panel'

export const darkCyberSkin: SkinDef = {
  id: 'dark-cyber',
  name: 'Dark Cyber',
  tokens: darkCyberTokens,
  zonePalette: darkCyberZonePalette,
  cssVars: darkCyberCssVars,
  cssOverrides: darkCyberCssOverrides,
  components: { Button, Dialog, Input, Select, Panel },
}
