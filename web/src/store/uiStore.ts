import { create } from 'zustand'
import type { GameCard, ActionLogEntry } from '../domain/types'

export type DialogType = 'setup' | 'search' | 'dice' | null

interface ContextMenuState {
  x: number
  y: number
  zoneId: string
  cardInstanceId: string
  card: GameCard
}

interface UIStore {
  selectedCardIds: Set<string>
  zoomCard: GameCard | null
  zoomPos: { x: number; y: number } | null
  contextMenu: ContextMenuState | null
  activeDialog: DialogType
  actionLog: ActionLogEntry[]
  deckPanelOpen: boolean

  selectCard: (instanceId: string, multi: boolean) => void
  clearSelection: () => void
  setZoom: (card: GameCard | null, pos?: { x: number; y: number }) => void
  openContextMenu: (state: ContextMenuState) => void
  closeContextMenu: () => void
  openDialog: (name: DialogType) => void
  closeDialog: () => void
  addLog: (message: string) => void
  openDeckPanel: () => void
  closeDeckPanel: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedCardIds: new Set(),
  zoomCard: null,
  zoomPos: null,
  contextMenu: null,
  activeDialog: null,
  actionLog: [],
  deckPanelOpen: false,

  selectCard: (instanceId, multi) =>
    set((s) => {
      const next = multi ? new Set(s.selectedCardIds) : new Set<string>()
      if (next.has(instanceId)) {
        next.delete(instanceId)
      } else {
        next.add(instanceId)
      }
      return { selectedCardIds: next }
    }),

  clearSelection: () => set({ selectedCardIds: new Set() }),

  setZoom: (card, pos) => set({ zoomCard: card, zoomPos: pos ?? null }),

  openContextMenu: (state) => set({ contextMenu: state }),

  closeContextMenu: () => set({ contextMenu: null }),

  openDialog: (name) => set({ activeDialog: name }),

  closeDialog: () => set({ activeDialog: null }),

  openDeckPanel: () => set({ deckPanelOpen: true }),
  closeDeckPanel: () => set({ deckPanelOpen: false }),

  addLog: (message) =>
    set((s) => ({
      actionLog: [
        { id: crypto.randomUUID(), message, timestamp: Date.now() },
        ...s.actionLog,
      ].slice(0, 200),
    })),
}))
