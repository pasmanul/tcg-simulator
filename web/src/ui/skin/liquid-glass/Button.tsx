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
    'rounded-md transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap'

  let variantClass = ''
  if (variant === 'primary') {
    variantClass =
      'bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold border-0'
  } else if (variant === 'secondary') {
    variantClass =
      'bg-stone-800/60 backdrop-blur-sm border border-stone-600/50 text-stone-300 hover:border-amber-600/50 hover:text-amber-400'
  } else if (variant === 'danger') {
    variantClass =
      'bg-stone-800/60 border border-stone-600/50 text-red-400 hover:border-red-500/50'
  } else if (variant === 'ghost') {
    variantClass =
      'bg-transparent border border-transparent text-stone-400 hover:bg-stone-800/40 hover:text-amber-400'
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
      style={style}
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
