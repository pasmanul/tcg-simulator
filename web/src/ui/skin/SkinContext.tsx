import React, { createContext, useContext } from 'react'
import { useSkinStore } from '../../store/skinStore'
import { defaultSkin } from '.'
import type { SkinDef, SkinComponents } from './types'

const SkinContext = createContext<SkinDef>(defaultSkin)

export function SkinProvider({ children }: { children: React.ReactNode }) {
  const skin = useSkinStore(s => s.currentSkin)
  return <SkinContext.Provider value={skin}>{children}</SkinContext.Provider>
}

export function useSkin(): SkinComponents {
  return useContext(SkinContext).components
}

export function useSkinDef(): SkinDef {
  return useContext(SkinContext)
}
