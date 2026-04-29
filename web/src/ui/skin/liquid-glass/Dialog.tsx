import React from 'react'
import type { DialogProps } from '../types'

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
    <div className="fixed inset-0 z-[200] bg-stone-950/70 backdrop-blur-[4px] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel */}
      <div
        className={`relative z-10 p-6 shadow-2xl overflow-y-auto max-h-[90vh] w-full ${width} ${className} backdrop-blur-[28px] bg-stone-900/70 border border-stone-700/40 rounded-lg`}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-stone-700/40 pb-2 mb-4">
            <span
              className="text-amber-400 text-base font-semibold"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors duration-150 leading-none text-lg"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
