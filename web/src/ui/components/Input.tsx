import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col">
      {label !== undefined && (
        <label className="font-mono text-[8px] text-muted mb-1">{label}</label>
      )}
      <input
        className={`w-full bg-surface2 border border-border rounded-theme px-3 py-2 text-text-base text-sm font-body focus:outline-none focus:border-primary ${className}`}
        {...rest}
      />
      {error !== undefined && (
        <span className="font-mono text-[7px] text-danger mt-1">{error}</span>
      )}
    </div>
  )
}
