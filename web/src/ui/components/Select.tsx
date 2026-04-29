import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col">
      {label !== undefined && (
        <label className="font-mono text-[8px] text-muted mb-1">{label}</label>
      )}
      <select
        className={`w-full bg-surface2 border border-border rounded-theme px-3 py-2 text-text-base text-sm font-body focus:outline-none focus:border-primary ${className}`}
        {...rest}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error !== undefined && (
        <span className="text-danger text-[8px] mt-1">{error}</span>
      )}
    </div>
  )
}
