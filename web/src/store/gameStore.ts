import { create } from 'zustand'
import type { Zone, GameCard, GameStateSnapshot } from '../domain/types'
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

  // Zone management
  initZones: (zoneIds: string[]) => void

  // Game actions (all push snapshot first)
  moveCard: (fromZoneId: string, instanceId: string, toZoneId: string, toIndex?: number) => void
  tapCard: (zoneId: string, instanceId: string) => void
  flipCard: (zoneId: string, instanceId: string) => void
  setRow: (zoneId: string, instanceId: string, row: 0 | 1) => void
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
  _applySnapshot: (snapshot: GameStateSnapshot) => void
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
  zone.cards = zone.cards.map(gc =>
    gc.instanceId === instanceId ? updater(gc) : gc,
  )
  return next
}

export const useGameStore = create<GameStore>((set, get) => ({
  zones: {},
  undoStack: [],

  initZones: (zoneIds) => {
    const zones: Record<string, Zone> = {}
    for (const id of zoneIds) {
      zones[id] = { zoneId: id, cards: [] }
    }
    set({ zones, undoStack: [] })
  },

  moveCard: (fromZoneId, instanceId, toZoneId, toIndex) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = moveCard(s.zones, fromZoneId, instanceId, toZoneId, toIndex)
      return { zones, undoStack }
    }),

  tapCard: (zoneId, instanceId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({
        ...gc, tapped: !gc.tapped,
      }))
      return { zones, undoStack }
    }),

  flipCard: (zoneId, instanceId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({
        ...gc, face_down: !gc.face_down,
      }))
      return { zones, undoStack }
    }),

  setRow: (zoneId, instanceId, row) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({ ...gc, row }))
      return { zones, undoStack }
    }),

  setMarker: (zoneId, instanceId, marker) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = updateCard(s.zones, zoneId, instanceId, gc => ({ ...gc, marker }))
      return { zones, undoStack }
    }),

  tapAllInZone: (zoneId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const next = cloneZones(s.zones)
      const zone = next[zoneId]
      if (zone) zone.cards = zone.cards.map(gc => ({ ...gc, tapped: true }))
      return { zones: next, undoStack }
    }),

  untapAllInZone: (zoneId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const next = cloneZones(s.zones)
      const zone = next[zoneId]
      if (zone) zone.cards = zone.cards.map(gc => ({ ...gc, tapped: false }))
      return { zones: next, undoStack }
    }),

  sortZone: (zoneId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = sortZone(s.zones, zoneId)
      return { zones, undoStack }
    }),

  shuffleZone: (zoneId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = shuffleZone(s.zones, zoneId)
      return { zones, undoStack }
    }),

  drawCard: () =>
    set((s) => {
      const deck = s.zones['deck']
      if (!deck || deck.cards.length === 0) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = moveCard(
        s.zones,
        'deck',
        deck.cards[deck.cards.length - 1].instanceId,
        'hand',
      )
      return { zones, undoStack }
    }),

  initializeField: (deckCards) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = initializeField(s.zones, deckCards)
      return { zones, undoStack }
    }),

  loadToDeck: (deckCards) =>
    set((s) => {
      if (!s.zones['deck']) return s
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = { ...s.zones, deck: { zoneId: 'deck', cards: shuffleArray(deckCards) } }
      return { zones, undoStack }
    }),

  stackCard: (fromZoneId, instanceId, toZoneId, targetInstanceId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = stackCard(s.zones, fromZoneId, instanceId, toZoneId, targetInstanceId)
      return { zones, undoStack }
    }),

  unstackCard: (zoneId, topInstanceId, detachInstanceId) =>
    set((s) => {
      const undoStack = pushSnapshot(s.undoStack, s.zones)
      const zones = unstackCard(s.zones, zoneId, topInstanceId, detachInstanceId)
      return { zones, undoStack }
    }),

  undo: () =>
    set((s) => {
      if (s.undoStack.length === 0) return s
      const stack = [...s.undoStack]
      const snap = stack.pop()!
      return { zones: cloneZones(snap.zones), undoStack: stack }
    }),

  loadSnapshot: (snapshot) =>
    set((s) => ({
      zones: cloneZones(snapshot.zones),
      undoStack: pushSnapshot(s.undoStack, s.zones),
    })),

  _applySnapshot: (snapshot) =>
    set(() => ({ zones: cloneZones(snapshot.zones) })),
}))
