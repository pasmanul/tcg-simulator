import React from 'react'
import type { ButtonProps } from '../types'

export function Button({
  variant = 'secondary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  style,
  children,
  type = 'button',
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  title,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const base =
    'rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap'

  let variantClass = ''
  if (variant === 'primary') {
    variantClass =
      'bg-indigo-600 hover:bg-indigo-500 text-white border-0'
  } else if (variant === 'secondary') {
    variantClass =
      'bg-white/[0.06] backdrop-blur-sm border border-white/15 text-slate-300 hover:bg-white/10 hover:border-indigo-400/50 hover:text-indigo-300'
  } else if (variant === 'danger') {
    variantClass =
      'bg-white/[0.06] border border-white/15 text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10'
  } else if (variant === 'ghost') {
    variantClass =
      'bg-transparent border border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-indigo-300'
  }

  const sizeClass =
    size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'

  const combined = [base, variantClass, sizeClass, className].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combined}
      style={{ fontFamily: 'DM Sans, sans-serif', ...style }}
      title={title}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
