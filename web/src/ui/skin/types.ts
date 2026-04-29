import type React from 'react'
import type { ThemeTokens } from '../../theme'

export type { ThemeTokens } from '../../theme'

export type ZonePalette = Record<string, [string, string, string, string, string]>

// ── Component props ──────────────────────────────────────────────────────────

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  onClick?: () => void
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>
  onMouseDown?: React.MouseEventHandler<HTMLButtonElement>
  title?: string
  'aria-label'?: string
}

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  width?: string
  className?: string
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export interface PanelProps {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'inset'
  style?: React.CSSProperties
}

// ── Skin definition ──────────────────────────────────────────────────────────

export interface SkinComponents {
  Button: React.FC<ButtonProps>
  Dialog: React.FC<DialogProps>
  Input:  React.FC<InputProps>
  Select: React.FC<SelectProps>
  Panel:  React.FC<PanelProps>
}

export interface SkinDef {
  id: string
  name: string
  tokens:       ThemeTokens
  zonePalette:  ZonePalette
  cssVars:      Record<string, string>
  cssOverrides?: string
  components:   SkinComponents
}
