import { create } from 'zustand'
import type { Card, DeckEntry, DeckRecord } from '../domain/types'
import { writeDeckPoolJson } from '../lib/cardStorage'

function effectiveCardBackUrl(decks: DeckRecord[], index: number, globalUrl: string): string {
  return decks[index]?.cardBack ?? globalUrl
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface LibraryStore {
  cards: Card[]
  imageUrls: Record<string, string>   // image_path -> objectURL（旧形式用）
  cardBackUrl: string                  // 実効値: デッキ固有 ?? グローバル
  _globalCardBackUrl: string           // back.jpg など全デッキ共通のフォールバック
  decks: DeckRecord[]
  activeDeckIndex: number             // -1 = デッキ未選択
  dirHandle: FileSystemDirectoryHandle | null

  // 現在のデッキ（activeDeckIndex から導出）
  currentDeck: () => DeckEntry[]
  currentDeckName: () => string

  loadLibrary: (
    cardsJson: Card[],
    decksJson: DeckRecord[],
    fileMap: Map<string, string>,
    dirHandle?: FileSystemDirectoryHandle,
  ) => void
  loadDeck: (cards: DeckEntry[]) => void  // 現在デッキのカードを更新
  resolveImageUrl: (card: Card) => string
  setCardBack: (url: string) => void
  setDeckCardBack: (dataUrl: string) => void

  // デッキ管理
  newDeck: (name: string) => void
  selectDeck: (index: number) => void
  renameDeck: (name: string) => void
  deleteDeck: () => void

  save: () => Promise<void>
  addCard: (data: Omit<Card, 'id' | 'count' | 'image_path' | 'image_data'>, imageFile?: File) => Promise<void>
  updateCard: (id: string, data: Omit<Card, 'id' | 'count' | 'image_path' | 'image_data'>, imageFile?: File) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  exportDeckJson: () => void
  exportPoolJson: () => void
  applyLibrarySnapshot: (cards: Card[], decks: DeckRecord[], activeDeckIndex: number) => void
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  cards: [],
  imageUrls: {},
  cardBackUrl: '',
  _globalCardBackUrl: '',
  decks: [],
  activeDeckIndex: -1,
  dirHandle: null,

  currentDeck: () => {
    const { decks, activeDeckIndex } = get()
    return decks[activeDeckIndex]?.cards ?? []
  },

  currentDeckName: () => {
    const { decks, activeDeckIndex } = get()
    return decks[activeDeckIndex]?.name ?? ''
  },

  loadLibrary: (cardsJson, decksJson, fileMap, dirHandle?) => {
    const urls: Record<string, string> = {}
    for (const card of cardsJson) {
      if (card.image_path) {
        const url = fileMap.get(card.image_path)
        if (url) urls[card.image_path] = url
      }
    }
    const activeDeckIndex = decksJson.length > 0 ? 0 : -1
    const globalUrl = get()._globalCardBackUrl
    set({
      cards: cardsJson,
      decks: decksJson,
      activeDeckIndex,
      imageUrls: urls,
      cardBackUrl: effectiveCardBackUrl(decksJson, activeDeckIndex, globalUrl),
      ...(dirHandle ? { dirHandle } : {}),
    })
  },

  loadDeck: (cards) => {
    const { decks, activeDeckIndex } = get()
    if (activeDeckIndex < 0) return
    set({
      decks: decks.map((d, i) => i === activeDeckIndex ? { ...d, cards } : d),
    })
  },

  resolveImageUrl: (card) => {
    if (card.image_data) return card.image_data
    const { imageUrls, cardBackUrl } = get()
    return imageUrls[card.image_path] ?? cardBackUrl ?? ''
  },

  setCardBack: (url) => {
    const { decks, activeDeckIndex } = get()
    set({ _globalCardBackUrl: url, cardBackUrl: effectiveCardBackUrl(decks, activeDeckIndex, url) })
  },

  setDeckCardBack: (dataUrl) => {
    const { decks, activeDeckIndex, _globalCardBackUrl } = get()
    if (activeDeckIndex < 0) return
    const newDecks = decks.map((d, i) => i === activeDeckIndex ? { ...d, cardBack: dataUrl } : d)
    set({ decks: newDecks, cardBackUrl: effectiveCardBackUrl(newDecks, activeDeckIndex, _globalCardBackUrl) })
  },

  newDeck: (name) => {
    const { decks, _globalCardBackUrl } = get()
    const newDecks = [...decks, { name, cards: [] }]
    const newIndex = newDecks.length - 1
    set({ decks: newDecks, activeDeckIndex: newIndex, cardBackUrl: effectiveCardBackUrl(newDecks, newIndex, _globalCardBackUrl) })
  },

  selectDeck: (index) => {
    const { decks, _globalCardBackUrl } = get()
    if (index < 0 || index >= decks.length) return
    set({ activeDeckIndex: index, cardBackUrl: effectiveCardBackUrl(decks, index, _globalCardBackUrl) })
  },

  renameDeck: (name) => {
    const { decks, activeDeckIndex } = get()
    if (activeDeckIndex < 0) return
    set({
      decks: decks.map((d, i) => i === activeDeckIndex ? { ...d, name } : d),
    })
  },

  deleteDeck: () => {
    const { decks, activeDeckIndex, _globalCardBackUrl } = get()
    if (activeDeckIndex < 0) return
    const newDecks = decks.filter((_, i) => i !== activeDeckIndex)
    const newIndex = newDecks.length === 0 ? -1 : Math.min(activeDeckIndex, newDecks.length - 1)
    set({
      decks: newDecks,
      activeDeckIndex: newIndex,
      cardBackUrl: effectiveCardBackUrl(newDecks, newIndex, _globalCardBackUrl),
    })
  },

  save: async () => {
    const { dirHandle, cards, decks } = get()
    if (!dirHandle) return
    await writeDeckPoolJson(dirHandle, { pool: cards, decks })
  },

  addCard: async (data, imageFile?) => {
    const { dirHandle, cards, decks } = get()
    if (!dirHandle) throw new Error('No dirHandle')
    let image_data: string | undefined
    if (imageFile) {
      image_data = await fileToBase64(imageFile)
    }
    const newCard: Card = {
      ...data,
      id: crypto.randomUUID(),
      image_path: '',
      image_data,
      count: 1,
    }
    const updated = [...cards, newCard]
    await writeDeckPoolJson(dirHandle, { pool: updated, decks })
    set({ cards: updated })
  },

  updateCard: async (id, data, imageFile?) => {
    const { dirHandle, cards, decks } = get()
    if (!dirHandle) throw new Error('No dirHandle')
    let image_data: string | undefined
    if (imageFile) {
      image_data = await fileToBase64(imageFile)
    }
    const updated = cards.map(c =>
      c.id === id
        ? { ...c, ...data, ...(image_data !== undefined ? { image_data } : {}) }
        : c
    )
    await writeDeckPoolJson(dirHandle, { pool: updated, decks })
    set({ cards: updated })
  },

  deleteCard: async (id) => {
    const { dirHandle, cards, decks } = get()
    if (!dirHandle) throw new Error('No dirHandle')
    const updated = cards.filter(c => c.id !== id)
    const updatedDecks = decks.map(d => ({
      ...d,
      cards: d.cards.filter(e => e.cardId !== id),
    }))
    await writeDeckPoolJson(dirHandle, { pool: updated, decks: updatedDecks })
    set({ cards: updated, decks: updatedDecks })
  },

  exportDeckJson: () => {
    const { decks, activeDeckIndex } = get()
    const deck = decks[activeDeckIndex]
    if (!deck) return
    downloadJson(deck, `${deck.name}.json`)
  },

  exportPoolJson: () => {
    downloadJson(get().cards, 'pool.json')
  },

  applyLibrarySnapshot: (cards, decks, activeDeckIndex) => {
    const { _globalCardBackUrl } = get()
    set({ cards, decks, activeDeckIndex, cardBackUrl: effectiveCardBackUrl(decks, activeDeckIndex, _globalCardBackUrl) })
  },
}))
