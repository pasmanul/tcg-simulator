import React from 'react'
import type { PanelProps } from '../types'

export function Panel({ children, className = '', style }: PanelProps) {
  return <div className={className} style={style}>{children}</div>
}
