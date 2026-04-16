import { create } from 'zustand'

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
import type { Card } from '../domain/types'
import { listDeckFiles, readDeckFile, writeDeckFile, type DeckJson } from '../lib/deckStorage'
import { writeCardsJson, saveImageToCards } from '../lib/cardStorage'

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

  addCard: (data: Omit<Card, 'id' | 'count' | 'image_path'>, imageFile?: File) => Promise<void>
  exportDeckJson: () => void
  exportPoolJson: () => void
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

  addCard: async (data, imageFile?) => {
    const { dirHandle, cards, imageUrls } = get()
    if (!dirHandle) throw new Error('No dirHandle')
    let image_path = ''
    const newUrls = { ...imageUrls }
    if (imageFile) {
      image_path = await saveImageToCards(dirHandle, imageFile)
      newUrls[image_path] = URL.createObjectURL(imageFile)
    }
    const newCard: Card = { ...data, id: crypto.randomUUID(), image_path, count: 1 }
    const updated = [...cards, newCard]
    await writeCardsJson(dirHandle, updated)
    set({ cards: updated, imageUrls: newUrls })
  },

  exportDeckJson: () => {
    const { currentDeck, deckName } = get()
    const name = deckName.trim() || '無題デッキ'
    downloadJson({ name, cards: currentDeck }, `${name}.json`)
  },

  exportPoolJson: () => {
    downloadJson(get().cards, 'cards.json')
  },
}))
