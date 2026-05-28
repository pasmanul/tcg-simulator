import { create } from 'zustand'
import type { Zone, GameCard, GameStateSnapshot, ZoneDefinition } from '../domain/types'
import { useLayoutStore } from './layoutStore'
import {
  cloneZones,
  pushSnapshot,
  moveCard,
  sortZone,
  shuffleZone,
  shuffleArray,
  initializeField,
  stackCard,
  unstackCard,
} from '../domain/gameLogic'

interface GameStore {
  zones: Record<string, Zone>
  undoStack: GameStateSnapshot[]
  revision: number

  // Zone management
  initZones: (zoneIds: string[]) => void
  initZonesFromDefs: (zoneDefs: ZoneDefinition[]) => void

  // Game actions (all push snapshot first)
  moveCard: (fromZoneId: string, instanceId: string, toZoneId: string, toIndex?: number, toRow?: number) => void
  tapCard: (zoneId: string, instanceId: string) => void
  flipCard: (zoneId: string, instanceId: string) => void
  setRow: (zoneId: string, instanceId: string, row: number) => void
  setMarker: (zoneId: string, instanceId: string, marker: string | null) => void
  tapAllInZone: (zoneId: string) => void
  untapAllInZone: (zoneId: string) => void
  sortZone: (zoneId: string) => void
  shuffleZone: (zoneId: string) => void
  drawCard: () => void
  initializeField: (deckCards: GameCard[]) => void

  // Load deck cards into deck zone only (preserves other zones)
  loadToDeck: (deckCards: GameCard[]) => void

  // Stack (evolution)
  stackCard: (fromZoneId: string, instanceId: string, toZoneId: string, targetInstanceId: string) => void
  unstackCard: (zoneId: string, topInstanceId: string, detachInstanceId: string) => void

  // Undo
  undo: () => void

  // Apply snapshot with undo push (save/load)
  loadSnapshot: (snapshot: GameStateSnapshot) => void

  // Internal: apply snapshot from remote tab (no undo push)
  _applySnapshot: (snapshot: GameStateSnapshot, revision?: number) => void

  // Zone structure mutations (inline editor)
  addZoneToGame: (zoneId: string) => void
  removeZoneFromGame: (zoneId: string) => void
}

function updateCard(
  zones: Record<string, Zone>,
  zoneId: string,
  instanceId: string,
  updater: (gc: GameCard) => GameCard,
): Record<string, Zone> {
  const next = cloneZones(zones)
  const zone = next[zoneId]
  if (!zone) return zones
  if (!zone.cards.some(gc => gc.instanceId === instanceId)) return zones
  zone.cards = zone.cards.map(gc =>
    gc.instanceId === instanceId ? updater(gc) : gc,
  )
  return next
}

export const useGameStore = create<GameStore>((set, get) => ({
  zones: {},
  undoStack: [],
  revision: 0,

  initZones: (zoneIds) => {
    const zones: Record<string, Zone> = {}
    for (const id of zoneIds) {
      zones[id] = { zoneId: id, cards: [] }
    }
    set(s => ({ zones, undoStack: [], revision: s.revision + 1 }))
  },

  initZonesFromDefs: (zoneDefs) => {
    const zoneIds = zoneDefs
      .filter(z => !z.source_zone_id && !z.ui_widget)
      .map(z => z.id)
    get().initZones([...new Set(zoneIds)])
  },

  moveCard: (fromZoneId, instanceId, toZoneId, toIndex, toRow) =>
    set((s) => {
      const zoneDefs = useLayoutStore.getState().zones
      let zones = moveCard(s.zones, fromZoneId, instanceId, toZoneId, toIndex, zoneDefs)
      if (toRow !== undefined) {
        zones = updateCard(zones, toZoneId, instanceId, gc => ({ ...gc, row: toRow }))
      }
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  tapCard: (zoneId, instanceId) =>
    set((s) => {
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({
        ...gc, tapped: !gc.tapped,
      }))
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  flipCard: (zoneId, instanceId) =>
    set((s) => {
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({
        ...gc, face_down: !gc.face_down,
      }))
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  setRow: (zoneId, instanceId, row) =>
    set((s) => {
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({ ...gc, row }))
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  setMarker: (zoneId, instanceId, marker) =>
    set((s) => {
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({ ...gc, marker }))
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  tapAllInZone: (zoneId) =>
    set((s) => {
      const next = cloneZones(s.zones)
      const zone = next[zoneId]
      if (!zone) return s
      if (zone) zone.cards = zone.cards.map(gc => ({ ...gc, tapped: true }))
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones: next, undoStack, revision: s.revision + 1 }
    }),

  untapAllInZone: (zoneId) =>
    set((s) => {
      const next = cloneZones(s.zones)
      const zone = next[zoneId]
      if (!zone) return s
      if (zone) zone.cards = zone.cards.map(gc => ({ ...gc, tapped: false }))
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones: next, undoStack, revision: s.revision + 1 }
    }),

  sortZone: (zoneId) =>
    set((s) => {
      const zones = sortZone(s.zones, zoneId)
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  shuffleZone: (zoneId) =>
    set((s) => {
      const zones = shuffleZone(s.zones, zoneId)
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  drawCard: () =>
    set((s) => {
      const deck = s.zones['deck']
      if (!deck || deck.cards.length === 0) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zoneDefs = useLayoutStore.getState().zones
      const zones = moveCard(
        s.zones,
        'deck',
        deck.cards[deck.cards.length - 1].instanceId,
        'hand',
        undefined,
        zoneDefs,
      )
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  initializeField: (deckCards) =>
    set((s) => {
      const zones = initializeField(s.zones, deckCards)
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  loadToDeck: (deckCards) =>
    set((s) => {
      if (!s.zones['deck']) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = { ...s.zones, deck: { zoneId: 'deck', cards: shuffleArray(deckCards) } }
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  stackCard: (fromZoneId, instanceId, toZoneId, targetInstanceId) =>
    set((s) => {
      const zones = stackCard(s.zones, fromZoneId, instanceId, toZoneId, targetInstanceId)
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  unstackCard: (zoneId, topInstanceId, detachInstanceId) =>
    set((s) => {
      const zones = unstackCard(s.zones, zoneId, topInstanceId, detachInstanceId)
      if (zones === s.zones) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      return { zones, undoStack, revision: s.revision + 1 }
    }),

  undo: () =>
    set((s) => {
      if (s.undoStack.length === 0) return s
      const stack = [...s.undoStack]
      const snap = stack.pop()!
      return { zones: cloneZones(snap.zones), undoStack: stack, revision: s.revision + 1 }
    }),

  loadSnapshot: (snapshot) =>
    set((s) => ({
      zones: cloneZones(snapshot.zones),
      undoStack: pushSnapshot(s.undoStack, s.zones),
      revision: s.revision + 1,
    })),

  _applySnapshot: (snapshot, revision) =>
    set((s) => {
      if (revision !== undefined && revision <= s.revision) return s
      return {
        zones: cloneZones(snapshot.zones),
        revision: revision ?? s.revision + 1,
      }
    }),

  addZoneToGame: (zoneId) =>
    set(s => ({ zones: { ...s.zones, [zoneId]: { zoneId, cards: [] } }, revision: s.revision + 1 })),

  removeZoneFromGame: (zoneId) =>
    set(s => {
      const next = { ...s.zones }
      delete next[zoneId]
      return { zones: next, revision: s.revision + 1 }
    }),
}))
