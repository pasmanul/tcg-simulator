import { create } from 'zustand'
import type { Card } from '../domain/types'
import { listDeckFiles, readDeckFile, writeDeckFile, type DeckJson } from '../lib/deckStorage'

interface DeckEntry {
  cardId: string
  count: number
}

interface LibraryStore {
  cards: Card[]
  imageUrls: Record<string, string>   // image_path -> objectURL
  cardBackUrl: string
  currentDeck: DeckEntry[]            // {cardId, count}[]
  deckName: string
  dirHandle: FileSystemDirectoryHandle | null
  deckFiles: string[]

  loadLibrary: (cardsJson: Card[], fileMap: Map<string, string>, dirHandle?: FileSystemDirectoryHandle) => void
  loadDeck: (deckJson: { cards: DeckEntry[]; name?: string }) => void
  resolveImageUrl: (imagePath: string) => string
  setCardBack: (url: string) => void

  listDeckFiles: () => Promise<void>
  loadDeckFile: (filename: string) => Promise<void>
  saveDeckFile: () => Promise<void>
  newDeck: () => void
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  cards: [],
  imageUrls: {},
  cardBackUrl: '',
  currentDeck: [],
  deckName: '',
  dirHandle: null,
  deckFiles: [],

  loadLibrary: (cardsJson, fileMap, dirHandle?) => {
    const urls: Record<string, string> = {}
    for (const card of cardsJson) {
      const url = fileMap.get(card.image_path)
      if (url) urls[card.image_path] = url
    }
    set({ cards: cardsJson, imageUrls: urls, ...(dirHandle ? { dirHandle } : {}) })
  },

  loadDeck: (deckJson) => {
    set({ currentDeck: deckJson.cards, deckName: deckJson.name ?? '' })
  },

  resolveImageUrl: (imagePath) => {
    const { imageUrls, cardBackUrl } = get()
    return imageUrls[imagePath] ?? cardBackUrl ?? ''
  },

  setCardBack: (url) => set({ cardBackUrl: url }),

  listDeckFiles: async () => {
    const { dirHandle } = get()
    if (!dirHandle) return
    try {
      const files = await listDeckFiles(dirHandle)
      set({ deckFiles: files })
    } catch {
      // decks/ フォルダがまだ存在しないケースは無視
    }
  },

  loadDeckFile: async (filename) => {
    const { dirHandle } = get()
    if (!dirHandle) return
    const deck = await readDeckFile(dirHandle, filename)
    set({ currentDeck: deck.cards, deckName: deck.name })
  },

  saveDeckFile: async () => {
    const { dirHandle, currentDeck, deckName } = get()
    if (!dirHandle) return
    const filename = deckName.trim() || '無題デッキ'
    const deck: DeckJson = { name: filename, cards: currentDeck }
    await writeDeckFile(dirHandle, filename, deck)
    const files = await listDeckFiles(dirHandle)
    set({ deckFiles: files, deckName: filename })
  },

  newDeck: () => set({ currentDeck: [], deckName: '' }),
}))
