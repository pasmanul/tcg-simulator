import React from 'react'
import type { PanelProps } from '../types'

export function Panel({ children, className = '', variant = 'default', style }: PanelProps) {
  let variantClass = ''

  if (variant === 'default') {
    variantClass =
      'backdrop-blur-[12px] bg-white/[0.06] border border-white/10 rounded-xl'
  } else if (variant === 'elevated') {
    variantClass =
      'backdrop-blur-[18px] bg-white/[0.09] border border-white/15 shadow-2xl rounded-xl'
  } else if (variant === 'inset') {
    variantClass =
      'backdrop-blur-[8px] bg-black/20 border border-white/[0.06] rounded-lg'
  }

  return (
    <div className={`${variantClass} ${className}`} style={style}>
      {children}
    </div>
  )
}
