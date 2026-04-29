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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(8,8,24,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative z-10 p-6 overflow-y-auto max-h-[90vh] w-full ${width} ${className} rounded-[6px]`}
        style={{
          background: 'linear-gradient(160deg, #08091e 0%, #060814 100%)',
          border: '1px solid rgba(124,58,237,0.35)',
          boxShadow: '0 0 40px rgba(124,58,237,0.15), 0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div
            className="flex items-center justify-between pb-3 mb-4"
            style={{ borderBottom: '1px solid rgba(124,58,237,0.25)' }}
          >
            <span
              className="text-base font-semibold tracking-wider"
              style={{ color: '#00FFFF', fontFamily: "'Chakra Petch', sans-serif" }}
            >
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="transition-colors duration-150 leading-none text-lg"
              style={{ color: '#94A3B8' }}
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
