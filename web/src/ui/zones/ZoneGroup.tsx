import { useRef } from 'react'
import { Group, Rect, Text, Image as KImage } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { ZoneDefinition } from '../../domain/types'
import { useGameStore } from '../../store/gameStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { zoneColors, CARD_W, CARD_H } from '../../theme'
import { useSkinStore } from '../../store/skinStore'
import { calcCardPositions } from '../hooks/useCardLayout'
import { CardShape } from '../cards/CardShape'
import { logCardName } from '../../domain/gameLogic'

interface Props {
  zoneDef: ZoneDefinition
  x: number
  y: number
  width: number
  height: number
  // Source zone override (for hand_view)
  sourceZoneId?: string
}

export function ZoneGroup({ zoneDef, x, y, width, height, sourceZoneId }: Props) {
  const zoneId = sourceZoneId ?? zoneDef.id
  const effectiveZoneId = zoneDef.source_zone_id ?? zoneDef.id

  const cards = useGameStore(s => s.zones[effectiveZoneId]?.cards ?? [])
  const moveCard = useGameStore(s => s.moveCard)
  const tapCard = useGameStore(s => s.tapCard)
  const { selectedCardIds, selectCard, clearSelection, openContextMenu, openStackDialog, addLog, setHoveredCard } = useUIStore(s => ({
    selectedCardIds: s.selectedCardIds,
    selectCard: s.selectCard,
    clearSelection: s.clearSelection,
    openContextMenu: s.openContextMenu,
    openStackDialog: s.openStackDialog,
    addLog: s.addLog,
    setHoveredCard: s.setHoveredCard,
  }))

  const cardBackUrl = useLibraryStore(s => s.cardBackUrl)
  const [backImg] = useImage(cardBackUrl)

  const zonePalette = useSkinStore(s => s.currentSkin.zonePalette)
  const tokens = useSkinStore(s => s.currentSkin.tokens)
  const colors = zoneColors(zoneDef.id, zonePalette)
  const cardScale = zoneDef.card_scale ?? 1.0

  const TITLE_H = 22
  const contentY = y + TITLE_H
  const contentH = height - TITLE_H

  const effectiveRowCount = zoneDef.row_count ?? (zoneDef.two_row ? 2 : 1)
  const baseCardW = CARD_W * cardScale
  const baseCardH = CARD_H * cardScale
  const rowH = contentH / effectiveRowCount
  const fitScale = Math.min(1, rowH / baseCardH)
  const cardW = Math.round(baseCardW * fitScale)
  const cardH = Math.round(baseCardH * fitScale)

  const positions = calcCardPositions(
    cards,
    x, contentY,
    width, contentH,
    cardW, cardH,
    effectiveRowCount,
  )

  // Find which zone contains a point (used for drop target detection)
  const groupRef = useRef<Konva.Group>(null)

  function handleDragStart() {
    // ZoneGroup 全体を Layer の最前面に移動してドラッグ中のカードが他ゾーンに隠れないようにする
    groupRef.current?.moveToTop()
    clearSelection()
  }

  function handleDragEnd(gc: import('../../domain/types').GameCard, dropX: number, dropY: number) {
    // The stage will call findDropTarget — we use a global event
    const event = new CustomEvent('card-drop', {
      detail: { fromZoneId: effectiveZoneId, instanceId: gc.instanceId, dropX, dropY },
    })
    window.dispatchEvent(event)
    addLog(`${zoneDef.name}から移動: ${logCardName(gc, zoneDef)}`)
  }

  function handleTap(gc: import('../../domain/types').GameCard) {
    if (zoneDef.tappable) {
      tapCard(zoneDef.id, gc.instanceId)
      addLog(`${gc.card.name} をタップ/アンタップ`)
    } else {
      selectCard(gc.instanceId, false)
    }
  }

  function handleHover(gc: import('../../domain/types').GameCard | null) {
    setHoveredCard(gc ? { instanceId: gc.instanceId, zoneId: zoneDef.id, cardName: gc.card.name } : null)
  }

  function handleContextMenu(
    gc: import('../../domain/types').GameCard,
    cx: number,
    cy: number,
  ) {
    openContextMenu({ x: cx, y: cy, zoneId: zoneDef.id, cardInstanceId: gc.instanceId, card: gc })
  }

  return (
    <Group ref={groupRef} id={`zone-${zoneDef.id}`}>
      {/* Zone background */}
      <Rect
        x={x} y={y} width={width} height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: height }}
        fillLinearGradientColorStops={[
          0, colors.bgTop,
          1, colors.bgBottom,
        ]}
        stroke={colors.border}
        strokeWidth={1}
        cornerRadius={8}
      />

      {/* Top accent line */}
      <Rect
        x={x + 1} y={y + 1}
        width={width - 2} height={3}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: 0 }}
        fillLinearGradientColorStops={[
          0, 'transparent',
          0.3, colors.border,
          0.7, colors.border,
          1, 'transparent',
        ]}
        cornerRadius={[8, 8, 0, 0]}
      />

      {/* Title bar */}
      <Rect
        x={x} y={y} width={width} height={TITLE_H}
        fill={colors.titleBar}
        cornerRadius={[8, 8, 0, 0]}
      />

      {/* Zone name + card count */}
      <Text
        x={x + 8} y={y + 4}
        text={`${zoneDef.name}  (${cards.length})`}
        fontSize={11}
        fill={colors.titleFg}
        fontFamily="'VT323', monospace"
        letterSpacing={0.5}
      />

      {/* Drop target overlay — transparent but captures events */}
      <Rect
        x={x} y={contentY}
        width={width} height={contentH}
        fill="transparent"
        id={`droptarget-${zoneDef.id}`}
      />

      {/* Pile mode: card back filling zone + count at bottom of card */}
      {zoneDef.pile_mode && cards.length > 0 && (() => {
        const PILE_BTN_H = 28
        const pileMaxH = contentH - PILE_BTN_H - 12
        const pileMaxW = width - 16
        const pileCardW = Math.min(pileMaxW, Math.round(pileMaxH * CARD_W / CARD_H))
        const pileCardH = Math.round(pileCardW * CARD_H / CARD_W)
        const pileX = x + width / 2 - pileCardW / 2
        const pileY = contentY + 4
        return (
          <>
            {backImg ? (
              <KImage
                x={pileX} y={pileY}
                width={pileCardW} height={pileCardH}
                image={backImg}
                cornerRadius={6}
                stroke={colors.border}
                strokeWidth={2}
              />
            ) : (
              <Rect
                x={pileX} y={pileY}
                width={pileCardW} height={pileCardH}
                fill={tokens.bg2}
                stroke={colors.border}
                strokeWidth={2}
                cornerRadius={6}
              />
            )}
            {(() => {
              const bt = `×${cards.length}`
              const bw = bt.length * 7 + 8
              const bh = 15
              const bx = pileX + pileCardW - bw + 6
              const by = pileY + pileCardH - bh + 6
              return (
                <>
                  <Rect x={bx} y={by} width={bw} height={bh}
                    fill={tokens.surface2} stroke={tokens.cyan} strokeWidth={1} cornerRadius={3} />
                  <Text x={bx} y={by + 2} width={bw} align="center"
                    text={bt} fontSize={9} fill={tokens.purpleLite}
                    fontFamily="'Press Start 2P', monospace" />
                </>
              )
            })()}
          </>
        )
      })()}

      {/* Cards */}
      {!zoneDef.pile_mode && (() => {
        const cardMap = new Map(cards.map(c => [c.instanceId, c]))
        return positions.map((pos) => {
        const gc = cardMap.get(pos.instanceId)
        if (!gc) return null
        return (
          <CardShape
            key={gc.instanceId}
            gc={gc}
            x={pos.x}
            y={pos.y}
            cardW={pos.cardW}
            cardH={pos.cardH}
            masked={zoneDef.masked}
            forceUp={zoneDef.show_face_up ?? false}
            selected={selectedCardIds.has(gc.instanceId)}
            draggable={!zoneDef.masked}
            onTap={handleTap}
            onContextMenu={handleContextMenu}
            onBadgeClick={(gc) => openStackDialog(gc, zoneDef.id)}
            onHover={handleHover}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        )
        })
      })()}

      {/* Card count badge (non-pile zones) */}
      {!zoneDef.pile_mode && cards.length > 0 && (() => {
        const bt = `×${cards.length}`
        const bw = bt.length * 7 + 8
        const bh = 15
        const bx = x + width - bw - 4
        const by = y + height - bh - 4
        return (
          <>
            <Rect x={bx} y={by} width={bw} height={bh}
              fill={tokens.surface2} stroke={tokens.cyan} strokeWidth={1} cornerRadius={3} listening={false} />
            <Text x={bx} y={by + 2} width={bw} align="center"
              text={bt} fontSize={9} fill={tokens.purpleLite}
              fontFamily="'Press Start 2P', monospace" listening={false} />
          </>
        )
      })()}

      {/* Neon glow border on hover (simulated with shadow) */}
      <Rect
        x={x} y={y} width={width} height={height}
        fill="transparent"
        stroke="transparent"
        cornerRadius={8}
        shadowColor={colors.border}
        shadowBlur={12}
        shadowOpacity={0.4}
        listening={false}
      />
    </Group>
  )
}
