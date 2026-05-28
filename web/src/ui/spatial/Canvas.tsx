import type { DragEvent, MouseEvent } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { newGameCard } from '../../domain/gameLogic'
import type { GameCard, ZoneDefinition } from '../../domain/types'
import { TONE_TOKENS, DEFAULT_LAYOUT, type Tone } from '../../theme'
import { ZoneBox, type DisplayCard } from './ZoneBox'
import { FloatingToolbar, InspectorPanel, HandDock } from './Chrome'

interface CanvasProps {
  onAddZone?: () => void
}

function findGameCard(cards: GameCard[], instanceId: string): GameCard | undefined {
  for (const gc of cards) {
    if (gc.instanceId === instanceId) return gc
    const found = findGameCard(gc.under_cards, instanceId)
    if (found) return found
  }
  return undefined
}

function getZoneVariant(zone: ZoneDefinition): 'tiles' | 'pile' | 'list' {
  if (zone.pile_mode) return 'pile'
  const entry = DEFAULT_LAYOUT.find(d => d.id === zone.id)
  return entry?.variant ?? 'tiles'
}

function getZoneAccent(zoneId: string, tone: Tone): string {
  const colors = TONE_TOKENS[tone].zone as Record<string, string>
  return colors[zoneId] ?? TONE_TOKENS[tone].text3 ?? '#6b7280'
}

function mapToDisplayCard(gc: GameCard, zone: ZoneDefinition, accent: string): DisplayCard {
  return {
    instanceId: gc.instanceId,
    name: gc.card.name,
    cost: gc.card.fields?.cost ?? gc.card.fields?.mana,
    civ: gc.card.fields?.civ ?? gc.card.fields?.civilization ?? gc.card.fields?.type,
    glow: accent + '55',
    titleFg: accent,
    tapped: gc.tapped,
    masked: zone.masked,
    faceDown: gc.face_down,
    imageData: gc.card.image_data,
    stackCount: gc.under_cards.length > 0 ? gc.under_cards.length : undefined,
  }
}

export function Canvas({ onAddZone }: CanvasProps) {
  const { zones: gameZones, undo, drawCard, initializeField, moveCard, stackCard } = useGameStore(s => ({
    zones: s.zones,
    undo: s.undo,
    drawCard: s.drawCard,
    initializeField: s.initializeField,
    moveCard: s.moveCard,
    stackCard: s.stackCard,
  }))
  const { zones: layoutZones, windows: layoutWindows } = useLayoutStore(s => ({ zones: s.zones, windows: s.windows }))
  const boardWindow = layoutWindows.find(w => w.id === 'board')
  const {
    spatialLayout, tone, layoutMode, selectedZoneId,
    updateZoneLayout, setSpatialTone, toggleLayoutMode, setSelectedZoneId,
    openDialog, openContextMenu, openDeckPanel, toggleSidebar, addLog,
    setDeckDropInfo, setHoveredCard, setZoom,
  } = useUIStore(s => ({
    spatialLayout: s.spatialLayout,
    tone: s.tone,
    layoutMode: s.layoutMode,
    selectedZoneId: s.selectedZoneId,
    updateZoneLayout: s.updateZoneLayout,
    setSpatialTone: s.setSpatialTone,
    toggleLayoutMode: s.toggleLayoutMode,
    setSelectedZoneId: s.setSelectedZoneId,
    openDialog: s.openDialog,
    openContextMenu: s.openContextMenu,
    openDeckPanel: s.openDeckPanel,
    toggleSidebar: s.toggleSidebar,
    addLog: s.addLog,
    setDeckDropInfo: s.setDeckDropInfo,
    setHoveredCard: s.setHoveredCard,
    setZoom: s.setZoom,
  }))
  const { cards: libraryCards, currentDeck: currentDeckFn } = useLibraryStore(s => ({
    cards: s.cards,
    currentDeck: s.currentDeck,
  }))

  // Board zones（ui_widgetのみ除外、source_zone_idミラーゾーンは含める）
  const boardZones = layoutZones.filter(
    z => z.window_id === 'board' && !z.ui_widget
  )

  const BOARD_TOP = 64   // FloatingToolbar 高さ + margin
  const BOARD_BOTTOM = 8 // 下端マージン（HandDockはhand_view位置に移動済み）

  function getZonePos(zone: ZoneDefinition) {
    if (spatialLayout[zone.id]) return spatialLayout[zone.id]
    if (zone.grid_pos && boardWindow) {
      const vw = window.innerWidth
      const usableH = window.innerHeight - BOARD_TOP - BOARD_BOTTOM
      const cellW = vw / boardWindow.grid_cols
      const cellH = usableH / boardWindow.grid_rows
      return {
        x: zone.grid_pos.col * cellW,
        y: BOARD_TOP + zone.grid_pos.row * cellH,
        w: zone.grid_pos.col_span * cellW,
        h: zone.grid_pos.row_span * cellH,
      }
    }
    const entry = DEFAULT_LAYOUT.find(d => d.id === zone.id)
    if (entry) return { x: entry.x, y: entry.y, w: entry.w, h: entry.h }
    const idx = boardZones.findIndex(z => z.id === zone.id)
    const col = idx % 3
    const row = Math.floor(idx / 3)
    return { x: 240 + col * 280, y: 80 + row * 220, w: 260, h: 200 }
  }

  function handleCardClick(zoneId: string, card: DisplayCard, e: MouseEvent) {
    const zone = gameZones[zoneId]
    if (!zone) return
    const gc = findGameCard(zone.cards, card.instanceId)
    if (!gc) return
    const zoneDef = layoutZones.find(z => z.id === zoneId)
    if (zoneDef?.tappable) {
      useGameStore.getState().tapCard(zoneId, card.instanceId)
      addLog(`${gc.card.name} をタップ/アンタップ`)
      return
    }
    openContextMenu({ x: e.clientX, y: e.clientY, zoneId, cardInstanceId: card.instanceId, card: gc })
  }

  function handleCardContextMenu(zoneId: string, card: DisplayCard, e: MouseEvent) {
    e.preventDefault()
    const zone = gameZones[zoneId]
    if (!zone) return
    const gc = findGameCard(zone.cards, card.instanceId)
    if (!gc) return
    openContextMenu({ x: e.clientX, y: e.clientY, zoneId, cardInstanceId: card.instanceId, card: gc })
  }

  function handleCardHover(zoneId: string, card: DisplayCard | null, pos?: { x: number; y: number }) {
    if (!card) {
      setHoveredCard(null)
      setZoom(null)
      return
    }
    const zone = gameZones[zoneId]
    const gc = zone ? findGameCard(zone.cards, card.instanceId) : undefined
    if (!gc) return
    setHoveredCard({ instanceId: card.instanceId, zoneId, cardName: gc.card.name })
    if (pos && !card.masked && !card.faceDown) {
      setZoom(gc, pos)
    }
  }

  function parseDrag(e: DragEvent): { fromZoneId: string; instanceId: string } | null {
    const raw = e.dataTransfer.getData('application/x-dmapp-card') || e.dataTransfer.getData('text/plain')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as { fromZoneId?: string; instanceId?: string }
      if (!parsed.fromZoneId || !parsed.instanceId) return null
      return { fromZoneId: parsed.fromZoneId, instanceId: parsed.instanceId }
    } catch {
      return null
    }
  }

  function handleCardDragStart(zoneId: string, card: DisplayCard, e: DragEvent) {
    e.dataTransfer.effectAllowed = 'move'
    const payload = JSON.stringify({ fromZoneId: zoneId, instanceId: card.instanceId })
    e.dataTransfer.setData('application/x-dmapp-card', payload)
    e.dataTransfer.setData('text/plain', payload)
    setZoom(null)
  }

  function handleCardDrop(targetZoneId: string, e: DragEvent, targetInstanceId?: string) {
    const payload = parseDrag(e)
    if (!payload) return
    e.preventDefault()
    e.stopPropagation()
    if (payload.instanceId === targetInstanceId) return

    const targetZone = layoutZones.find(z => z.id === targetZoneId)
    if (targetZoneId === 'deck' && payload.fromZoneId !== 'deck' && !targetInstanceId) {
      setDeckDropInfo({ fromZoneId: payload.fromZoneId, instanceId: payload.instanceId })
      return
    }

    if (targetInstanceId && !targetZone?.pile_mode) {
      stackCard(payload.fromZoneId, payload.instanceId, targetZoneId, targetInstanceId)
      addLog(`進化スタック → ${targetZone?.name ?? targetZoneId}`)
      return
    }

    if (payload.fromZoneId !== targetZoneId) {
      moveCard(payload.fromZoneId, payload.instanceId, targetZoneId)
      addLog(`カード移動 → ${targetZone?.name ?? targetZoneId}`)
    }
  }

  function flattenCards(gcs: GameCard[]): GameCard[] {
    return gcs.flatMap(gc => [gc, ...flattenCards(gc.under_cards)])
  }

  function handleInit() {
    let deckCards: GameCard[]
    if (libraryCards.length === 0) {
      deckCards = Object.values(gameZones).flatMap(zone => flattenCards(zone.cards))
    } else {
      const cardMap = new Map(libraryCards.map(c => [c.id, c]))
      const currentDeck = currentDeckFn()
      deckCards = currentDeck.flatMap(entry => {
        const card = cardMap.get(entry.cardId)
        if (!card) return []
        return Array.from({ length: entry.count }, () => newGameCard(card))
      })
    }
    if (deckCards.length === 0) { addLog('デッキが空です'); return }
    initializeField(deckCards)
    addLog(`フィールド初期化 — ${deckCards.length}枚`)
  }

  const t = TONE_TOKENS[tone]

  // Hand zone cards for HandDock
  const handZone = layoutZones.find(z => z.id === 'hand')
  const handCards: DisplayCard[] = (gameZones['hand']?.cards ?? []).map(gc =>
    mapToDisplayCard(gc, handZone ?? { id: 'hand', masked: false } as ZoneDefinition, t.zone.hand)
  )

  // Hand dock position — stored in spatialLayout, else use hand_view grid_pos, else default (bottom-center)
  const handViewZone = layoutZones.find(z => z.id === 'hand_view')
  const handViewPos = handViewZone ? getZonePos(handViewZone) : undefined
  const handPos = (spatialLayout['hand'] ?? handViewPos) as { x: number; y: number; w: number; h: number } | undefined

  // Selected zone info for InspectorPanel
  const selectedZone = selectedZoneId
    ? (() => {
        if (selectedZoneId === 'hand') {
          const pos = handPos ?? { x: 0, y: 0, w: 400, h: 140 }
          return { id: 'hand', title: handZone?.name ?? 'Hand', ...pos }
        }
        const zone = layoutZones.find(z => z.id === selectedZoneId)
        if (!zone) return null
        const pos = getZonePos(zone)
        return { id: zone.id, title: zone.name, ...pos }
      })()
    : null

  return (
    <div
      data-tone={tone}
      className="sp-canvas-bg"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: 'var(--font-body)' }}
    >
      {/* Floating toolbar */}
      <FloatingToolbar
        onMenu={toggleSidebar}
        onInit={handleInit}
        onDraw={drawCard}
        onUndo={undo}
        onDice={() => openDialog('dice')}
        onSave={() => openDialog('save-load')}
        onLoad={() => openDialog('setup')}
        onHand={() => window.open('/hand.html', 'hand', 'width=540,height=720')}
        onDeck={openDeckPanel}
        layoutMode={layoutMode}
        onToggleLayout={toggleLayoutMode}
        tone={tone}
        onToggleTone={() => setSpatialTone(tone === 'dusk' ? 'dawn' : 'dusk')}
      />

      {/* Inspector panel (layout mode) */}
      {layoutMode && (
        <InspectorPanel
          zone={selectedZone}
          onUpdate={(patch) => selectedZoneId && updateZoneLayout(selectedZoneId, patch)}
          onClose={() => setSelectedZoneId(null)}
        />
      )}

      {/* Zone boxes */}
      {boardZones.map((zone) => {
        const pos = getZonePos(zone)
        const accent = getZoneAccent(zone.id, tone)
        const sourceId = zone.source_zone_id ?? zone.id
        const cards = (gameZones[sourceId]?.cards ?? []).map(gc => mapToDisplayCard(gc, zone, accent))
        return (
          <ZoneBox
            key={zone.id}
            id={zone.id}
            x={pos.x} y={pos.y} w={pos.w} h={pos.h}
            title={zone.name}
            accent={accent}
            cards={cards}
            variant={getZoneVariant(zone)}
            cardScale={zone.masked ? 1 : 2}
            selected={selectedZoneId === zone.id}
            onSelect={setSelectedZoneId}
            onMove={(id, x, y) => {
              const cur = getZonePos(zone)
              updateZoneLayout(id, { x, y, w: cur.w, h: cur.h })
            }}
            onResize={(id, w, h) => {
              const cur = getZonePos(zone)
              updateZoneLayout(id, { x: cur.x, y: cur.y, w, h })
            }}
            onCardClick={(card, _i, e) => handleCardClick(sourceId, card, e)}
            onCardContextMenu={(card, _i, e) => handleCardContextMenu(sourceId, card, e)}
            onCardDragStart={(card, e) => handleCardDragStart(sourceId, card, e)}
            onCardDrop={(e, targetInstanceId) => handleCardDrop(sourceId, e, targetInstanceId)}
            onCardHover={(card, pos) => handleCardHover(sourceId, card, pos)}
            layoutMode={layoutMode}
          />
        )
      })}

      {/* Hand dock */}
      <HandDock
        cards={handCards}
        onCardClick={(card, _i, e) => handleCardClick('hand', card, e)}
        onCardContextMenu={(card, _i, e) => handleCardContextMenu('hand', card, e)}
        onCardDragStart={(card, e) => handleCardDragStart('hand', card, e)}
        onCardDrop={(e, targetInstanceId) => handleCardDrop('hand', e, targetInstanceId)}
        onCardHover={(card, pos) => handleCardHover('hand', card, pos)}
        layoutMode={layoutMode}
        position={handPos}
        selected={selectedZoneId === 'hand'}
        onSelect={() => setSelectedZoneId('hand')}
        onInitPosition={(x, y, w, h) => updateZoneLayout('hand', { x, y, w, h })}
        onMove={(x, y) => updateZoneLayout('hand', { x, y })}
        onResize={(w, h) => updateZoneLayout('hand', { w, h })}
      />
    </div>
  )
}
