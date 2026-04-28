/** Shared layout constants and styles for page-level components */
import type React from 'react'

export const PAGE_CLASSES = 'flex flex-col w-full h-full overflow-hidden bg-bg text-text-base'

/** @deprecated Use PAGE_CLASSES (Tailwind) instead. Kept for backward compatibility. */
export const PAGE_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  background: 'var(--bg, #0F0F23)',
  overflow: 'hidden',
}
