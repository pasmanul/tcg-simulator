import React from 'react'
import type { SelectProps } from '../types'

export function Select({ label, error, options, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col">
      {label !== undefined && (
        <label
          className="text-xs text-slate-400 mb-1"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {label}
        </label>
      )}
      <select
        className={`w-full bg-white/[0.06] backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-400/60 focus:bg-white/[0.09] ${className}`}
        style={{ fontFamily: 'DM Sans, sans-serif' }}
        {...rest}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error !== undefined && (
        <span
          className="text-xs text-rose-400 mt-1"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
