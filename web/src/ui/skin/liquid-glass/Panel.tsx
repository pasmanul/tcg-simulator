import React from 'react'
import type { PanelProps } from '../types'

export function Panel({ children, className = '', variant = 'default', style }: PanelProps) {
  let variantClass = ''

  if (variant === 'default') {
    variantClass =
      'backdrop-blur-[20px] bg-stone-900/60 border border-stone-700/40 rounded-lg'
  } else if (variant === 'elevated') {
    variantClass =
      'backdrop-blur-[28px] bg-stone-900/70 shadow-lg border border-stone-700/40 rounded-lg border-t-amber-600/20'
  } else if (variant === 'inset') {
    variantClass =
      'backdrop-blur-[12px] bg-stone-950/60 border border-stone-800/40 rounded-lg'
  }

  return (
    <div className={`${variantClass} ${className}`} style={style}>
      {children}
    </div>
  )
}
