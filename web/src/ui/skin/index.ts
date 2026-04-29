// Skin registry — add new skins here
import { retroStubSkin } from './retro-stub'
import { liquidGlassSkin } from './liquid-glass'
import { glassmorphismSkin } from './glassmorphism'
import type { SkinDef } from './types'

export type { SkinDef }

export const SKINS: SkinDef[] = [
  retroStubSkin,
  liquidGlassSkin,
  glassmorphismSkin,
]

export const defaultSkin = liquidGlassSkin
