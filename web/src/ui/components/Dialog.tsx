import React from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  width?: string
  className?: string
}

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative z-10 bg-surface border border-border rounded-theme p-6 shadow-2xl overflow-y-auto max-h-[90vh] w-full ${width} ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] text-accent">{title}</span>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] text-muted hover:text-text-base transition-colors duration-150 leading-none"
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
