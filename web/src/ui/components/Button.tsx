import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  onClick?: () => void
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>
  'aria-label'?: string
}

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
  'aria-label': ariaLabel,
}: ButtonProps) {
  const base =
    'font-mono rounded-theme cursor-pointer transition-all duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'

  let variantClass = ''
  if (variant === 'primary') {
    variantClass = 'bg-primary text-white border-0 hover:opacity-85'
  } else if (variant === 'secondary') {
    variantClass = 'bg-surface2 text-muted border border-border hover:bg-surface hover:text-accent'
  } else if (variant === 'danger') {
    variantClass = 'bg-surface2 text-danger border border-border hover:bg-surface hover:text-danger'
  } else if (variant === 'ghost') {
    variantClass = 'bg-transparent text-muted border border-border hover:bg-surface hover:text-accent'
  }

  const sizeClass = size === 'sm'
    ? 'text-[7px] px-2 py-1'
    : 'text-[8px] px-3 py-1.5'

  const combined = [base, variantClass, sizeClass, className].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combined}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
