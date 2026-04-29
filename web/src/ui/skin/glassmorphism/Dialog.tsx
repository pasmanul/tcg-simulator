import React from 'react'
import type { DialogProps } from '../types'
import { Panel } from './Panel'

export function Dialog({
  open,
  onClose,
  title,
  children,
  width = 'max-w-md',
  className = '',
}: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-[8px] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel */}
      <Panel
        variant="elevated"
        className={`relative z-10 p-6 overflow-y-auto max-h-[90vh] w-full mx-4 ${width} ${className}`}
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {title !== undefined && (
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span
                className="text-base font-semibold tracking-wide bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {title}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition-colors duration-150 leading-none text-lg"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
          )}

          {children}
        </div>
      </Panel>
    </div>
  )
}
