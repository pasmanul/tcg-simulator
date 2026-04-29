export function hexToRgb(hex: string): string {
  const c = hex.replace('#', '')
  return `${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)}`
}
