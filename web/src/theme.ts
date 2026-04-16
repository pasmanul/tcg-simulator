// Ported from ui/theme.py — civilization color palette

export interface ZoneColors {
  bgTop: string
  bgBottom: string
  border: string
  titleFg: string
  titleBar: string
}

const ZONE_PALETTE: Record<string, [string, string, string, string, string]> = {
  battle:    ['#1e0a0b', '#0d0506', '#c82030', '#ff8090', '#2c0a10'],
  mana:      ['#081c0c', '#040e06', '#28a848', '#66dd88', '#082214'],
  shield:    ['#1c1608', '#0e0b04', '#c89420', '#ffdd66', '#221c06'],
  graveyard: ['#120818', '#09040e', '#8820b8', '#cc66ee', '#1a0a28'],
  deck:      ['#061420', '#03080e', '#1880c8', '#44aaff', '#041020'],
  hand:      ['#061a1a', '#030e0e', '#20a8b0', '#55ddee', '#041818'],
  temp:      ['#0c1018', '#080c12', '#505c78', '#8899bb', '#0a0e18'],
}

export function zoneColors(zoneId: string): ZoneColors {
  const t = ZONE_PALETTE[zoneId] ?? ZONE_PALETTE['temp']
  return { bgTop: t[0], bgBottom: t[1], border: t[2], titleFg: t[3], titleBar: t[4] }
}

// App-wide design tokens (from landing.html)
export const TOKENS = {
  bg:         '#0F0F23',
  bg2:        '#080818',
  purple:     '#7C3AED',
  purpleLite: '#A78BFA',
  cyan:       '#00FFFF',
  pink:       '#FF006E',
  text:       '#E2E8F0',
  muted:      '#94A3B8',
  border:     'rgba(124,58,237,0.30)',
}

export const CARD_W = 150
export const CARD_H = 210
