import type { GameCard } from '../../domain/types'

export interface CardPosition {
  instanceId: string
  x: number
  y: number
  cardW: number
  cardH: number
}

const PADDING = 8
const MIN_SPACING = 16

function layoutRow(
  cards: GameCard[],
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  cardW: number,
  cardH: number,
): CardPosition[] {
  const n = cards.length
  if (n === 0) return []

  // Effective width accounts for tapped cards (90deg rotation → width becomes cardH)
  const totalNatural = cards.reduce((sum, gc) => sum + (gc.tapped ? cardH : cardW), 0)
  const availW = areaW - PADDING * 2

  let positions: number[]
  if (totalNatural + (n - 1) * MIN_SPACING <= availW) {
    // Cards fit with natural spacing
    const spacing = n > 1 ? (availW - totalNatural) / (n - 1) : 0
    let x = areaX + PADDING
    positions = cards.map(gc => {
      const pos = x
      x += (gc.tapped ? cardH : cardW) + spacing
      return pos
    })
  } else {
    // Overlap cards
    const overlap = n > 1 ? Math.max(MIN_SPACING, (availW - (cards[n - 1].tapped ? cardH : cardW)) / (n - 1)) : 0
    let x = areaX + PADDING
    positions = cards.map((gc, i) => {
      const pos = x
      if (i < n - 1) x += overlap
      else x += gc.tapped ? cardH : cardW
      return pos
    })
  }

  const cy = areaY + (areaH - cardH) / 2

  return cards.map((gc, i) => ({
    instanceId: gc.instanceId,
    x: positions[i],
    y: cy,
    cardW,
    cardH,
  }))
}

export function calcCardPositions(
  cards: GameCard[],
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  cardW: number,
  cardH: number,
  twoRow: boolean,
): CardPosition[] {
  if (cards.length === 0) return []

  if (!twoRow) {
    return layoutRow(cards, areaX, areaY, areaW, areaH, cardW, cardH)
  }

  // two_row: row=0 bottom, row=1 top
  const row0 = cards.filter(gc => gc.row === 0)
  const row1 = cards.filter(gc => gc.row === 1)
  const halfH = areaH / 2

  const bottom = layoutRow(row0, areaX, areaY + halfH, areaW, halfH, cardW, cardH)
  const top = layoutRow(row1, areaX, areaY, areaW, halfH, cardW, cardH)

  return [...top, ...bottom]
}
