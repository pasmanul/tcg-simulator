import React from 'react'
import type { PanelProps } from '../types'

export function Panel({ children, className = '', variant = 'default', style }: PanelProps) {
  let panelStyle: React.CSSProperties = {}

  if (variant === 'default') {
    panelStyle = {
      background: 'rgba(8,9,30,0.7)',
      border: '1px solid rgba(124,58,237,0.20)',
      borderRadius: '6px',
    }
  } else if (variant === 'elevated') {
    panelStyle = {
      background: 'rgba(8,9,30,0.85)',
      border: '1px solid rgba(124,58,237,0.30)',
      borderTopColor: 'rgba(167,139,250,0.20)',
      borderRadius: '6px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(124,58,237,0.08)',
    }
  } else if (variant === 'inset') {
    panelStyle = {
      background: 'rgba(6,8,20,0.7)',
      border: '1px solid rgba(124,58,237,0.15)',
      borderRadius: '4px',
    }
  }

  return (
    <div className={className} style={{ ...panelStyle, ...style }}>
      {children}
    </div>
  )
}
