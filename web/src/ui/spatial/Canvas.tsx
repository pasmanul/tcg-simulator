import type { MouseEvent } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { newGameCard } from '../../domain/gameLogic'
import type { GameCard, ZoneDefinition } from '../../domain/types'
import { TONE_TOKENS, DEFAULT_LAYOUT, type Tone } from '../../theme'
import { ZoneBox, type DisplayCard } from './ZoneBox'
import { FloatingToolbar, LayersPanel, InspectorPanel, HandDock } from './Chrome'

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
  const { zones: gameZones, undo, drawCard, initializeField } = useGameStore(s => ({
    zones: s.zones,
    undo: s.undo,
    drawCard: s.drawCard,
    initializeField: s.initializeField,
  }))
  const { zones: layoutZones } = useLayoutStore(s => ({ zones: s.zones }))
  const {
    spatialLayout, tone, layoutMode, selectedZoneId,
    updateZoneLayout, setSpatialTone, toggleLayoutMode, setSelectedZoneId,
    openDialog, openContextMenu, openDeckPanel, toggleSidebar, addLog,
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
  }))
  const { cards: libraryCards, currentDeck: currentDeckFn } = useLibraryStore(s => ({
    cards: s.cards,
    currentDeck: s.currentDeck,
  }))

  // Board zones only (exclude hand, source_zone_id mirrors, ui_widget)
  const boardZones = layoutZones.filter(
    z => z.window_id === 'board' && !z.source_zone_id && !z.ui_widget
  )

  function getZonePos(zoneId: string, idx: number) {
    if (spatialLayout[zoneId]) return spatialLayout[zoneId]
    const entry = DEFAULT_LAYOUT.find(d => d.id === zoneId)
    if (entry) return { x: entry.x, y: entry.y, w: entry.w, h: entry.h }
    const col = idx % 3
    const row = Math.floor(idx / 3)
    return { x: 240 + col * 280, y: 80 + row * 220, w: 260, h: 200 }
  }

  function handleCardClick(zoneId: string, card: DisplayCard, e: MouseEvent) {
    const zone = gameZones[zoneId]
    if (!zone) return
    const gc = findGameCard(zone.cards, card.instanceId)
    if (!gc) return
    openContextMenu({ x: e.clientX, y: e.clientY, zoneId, cardInstanceId: card.instanceId, card: gc })
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

  // LayersPanel zone list (board zones + hand)
  const handZone = layoutZones.find(z => z.id === 'hand')
  const zonePanelList = [
    ...boardZones.map(zone => ({
      id: zone.id,
      title: zone.name,
      accent: getZoneAccent(zone.id, tone),
      count: gameZones[zone.id]?.cards.length ?? 0,
    })),
    ...(handZone ? [{
      id: 'hand',
      title: handZone.name,
      accent: t.zone.hand,
      count: gameZones['hand']?.cards.length ?? 0,
    }] : []),
  ]

  // Hand zone cards for HandDock
  const handCards: DisplayCard[] = (gameZones['hand']?.cards ?? []).map(gc =>
    mapToDisplayCard(gc, handZone ?? { id: 'hand', masked: false } as ZoneDefinition, t.zone.hand)
  )

  // Hand dock position — stored in spatialLayout, else default (bottom-center)
  const handPos = spatialLayout['hand'] as { x: number; y: number; w: number; h: number } | undefined

  // Selected zone info for InspectorPanel
  const selectedZone = selectedZoneId
    ? (() => {
        if (selectedZoneId === 'hand') {
          const pos = handPos ?? { x: 0, y: 0, w: 400, h: 140 }
          return { id: 'hand', title: handZone?.name ?? 'Hand', ...pos }
        }
        const zone = layoutZones.find(z => z.id === selectedZoneId)
        if (!zone) return null
        const pos = getZonePos(selectedZoneId, 0)
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

      {/* Layers panel */}
      <LayersPanel
        zones={zonePanelList}
        selected={selectedZoneId}
        onSelect={setSelectedZoneId}
        onAddZone={onAddZone}
        layoutMode={layoutMode}
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
      {boardZones.map((zone, idx) => {
        const pos = getZonePos(zone.id, idx)
        const accent = getZoneAccent(zone.id, tone)
        const cards = (gameZones[zone.id]?.cards ?? []).map(gc => mapToDisplayCard(gc, zone, accent))
        return (
          <ZoneBox
            key={zone.id}
            id={zone.id}
            x={pos.x} y={pos.y} w={pos.w} h={pos.h}
            title={zone.name}
            accent={accent}
            cards={cards}
            variant={getZoneVariant(zone)}
            selected={selectedZoneId === zone.id}
            onSelect={setSelectedZoneId}
            onMove={(id, x, y) => updateZoneLayout(id, { x, y })}
            onResize={(id, w, h) => updateZoneLayout(id, { w, h })}
            onCardClick={(card, _i, e) => handleCardClick(zone.id, card, e)}
            layoutMode={layoutMode}
          />
        )
      })}

      {/* Hand dock */}
      <HandDock
        cards={handCards}
        onCardClick={(card, _i, e) => handleCardClick('hand', card, e)}
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
