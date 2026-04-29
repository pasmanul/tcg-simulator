import React from 'react'
import type { InputProps } from '../types'

export function Input({ label, error, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col">
      {label !== undefined && (
        <label className="text-xs text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {label}
        </label>
      )}
      <input
        className={`w-full bg-stone-800/60 backdrop-blur-sm border border-stone-600/50 rounded-md px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-600/70 focus:bg-stone-800/80 ${className}`}
        {...rest}
      />
      {error !== undefined && (
        <span className="text-xs text-red-400 mt-1">{error}</span>
      )}
    </div>
  )
}
