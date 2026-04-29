import React from 'react'
import type { SelectProps } from '../types'

export function Select({ label, error, options, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col">
      {label !== undefined && (
        <label
          className="text-xs mb-1 tracking-wide"
          style={{ color: '#94A3B8', fontFamily: "'Chakra Petch', sans-serif" }}
        >
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-[4px] px-3 py-2 text-sm focus:outline-none transition-all duration-150 cursor-pointer ${className}`}
        style={{
          background: 'rgba(6,8,20,0.8)',
          border: '1px solid rgba(124,58,237,0.30)',
          color: '#E2E8F0',
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1px solid rgba(0,255,255,0.50)'
          e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,255,0.15)'
          rest.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = '1px solid rgba(124,58,237,0.30)'
          e.currentTarget.style.boxShadow = 'none'
          rest.onBlur?.(e)
        }}
        {...rest}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#060814' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error !== undefined && (
        <span className="text-xs mt-1" style={{ color: '#FF006E' }}>{error}</span>
      )}
    </div>
  )
}
