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
    'transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap font-medium tracking-wide'

  const radius = 'rounded-[4px]'

  let variantStyle: React.CSSProperties = {}
  let variantClass = ''

  if (variant === 'primary') {
    variantClass = 'text-white font-semibold'
    variantStyle = {
      background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
      border: '1px solid rgba(167,139,250,0.4)',
      boxShadow: '0 0 12px rgba(124,58,237,0.4), inset 0 1px 0 rgba(167,139,250,0.15)',
    }
  } else if (variant === 'secondary') {
    variantClass = 'text-slate-300 hover:text-violet-300'
    variantStyle = {
      background: 'rgba(8,9,30,0.8)',
      border: '1px solid rgba(124,58,237,0.35)',
    }
  } else if (variant === 'danger') {
    variantClass = 'text-pink-400 hover:text-pink-300'
    variantStyle = {
      background: 'rgba(8,9,30,0.8)',
      border: '1px solid rgba(255,0,110,0.35)',
    }
  } else if (variant === 'ghost') {
    variantClass = 'text-slate-400 hover:text-violet-400'
    variantStyle = {
      background: 'transparent',
      border: '1px solid transparent',
    }
  }

  const sizeClass =
    size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'

  const combined = [base, radius, variantClass, sizeClass, className].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combined}
      style={{ ...variantStyle, ...style }}
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
