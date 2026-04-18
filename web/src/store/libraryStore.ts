import { create } from 'zustand'
import type { Card, DeckEntry, DeckRecord, FieldDef, GameConfigJson, GameProfile } from '../domain/types'
import defaultBoardConfig from '../assets/gameConfig.json'
import { useLayoutStore } from './layoutStore'

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

type WritableHandle = FileSystemFileHandle & { createWritable(): Promise<FileSystemWritableFileStream> }

async function writeGameProfile(fileHandle: FileSystemFileHandle, profile: GameProfile): Promise<void> {
  const writable = await (fileHandle as WritableHandle).createWritable()
  await writable.write(JSON.stringify(profile, null, 2))
  await writable.close()
}

interface LibraryStore {
  cards: Card[]
  imageUrls: Record<string, string>   // image_path -> objectURL（旧形式用）
  cardBackUrl: string                  // 実効値: デッキ固有 ?? グローバル
  _globalCardBackUrl: string           // back.jpg など全デッキ共通のフォールバック
  decks: DeckRecord[]
  activeDeckIndex: number             // -1 = デッキ未選択
  fileHandle: FileSystemFileHandle | null

  // GameProfile 拡張フィールド
  profileName: string
  fieldDefs: FieldDef[]
  deckRules: { maxDeckSize?: number; maxCopies?: number }
  boardConfig: GameConfigJson

  // 現在のデッキ（activeDeckIndex から導出）
  currentDeck: () => DeckEntry[]
  currentDeckName: () => string

  loadLibrary: (
    cardsJson: Card[],
    decksJson: DeckRecord[],
    fileMap: Map<string, string>,
    fileHandle?: FileSystemFileHandle,
  ) => void
  loadGameProfile: (fileHandle: FileSystemFileHandle) => Promise<void>
  exportGameProfile: () => void
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
  addCard: (name: string, fields: Record<string, any>, imageFile?: File) => Promise<void>
  updateCard: (id: string, name: string, fields: Record<string, any>, imageFile?: File) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  exportDeckJson: () => void
  exportPoolJson: () => void
  applyLibrarySnapshot: (
    cards: Card[],
    decks: DeckRecord[],
    activeDeckIndex: number,
    fieldDefs?: FieldDef[],
    deckRules?: { maxDeckSize?: number; maxCopies?: number },
    boardConfig?: GameConfigJson,
    profileName?: string,
  ) => void
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  cards: [],
  imageUrls: {},
  cardBackUrl: '',
  _globalCardBackUrl: '',
  decks: [],
  activeDeckIndex: -1,
  fileHandle: null,

  // GameProfile 拡張フィールド初期値
  profileName: '',
  fieldDefs: [],
  deckRules: {},
  boardConfig: defaultBoardConfig as GameConfigJson,

  currentDeck: () => {
    const { decks, activeDeckIndex } = get()
    return (decks[activeDeckIndex]?.cards ?? []) as DeckEntry[]
  },

  currentDeckName: () => {
    const { decks, activeDeckIndex } = get()
    return decks[activeDeckIndex]?.name ?? ''
  },

  loadLibrary: (cardsJson, decksJson, fileMap, fileHandle?) => {
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
      ...(fileHandle ? { fileHandle } : {}),
    })
  },

  loadGameProfile: async (fileHandle) => {
    const file = await fileHandle.getFile()
    const raw = JSON.parse(await file.text()) as Partial<GameProfile>
    const cardsJson: Card[] = raw.pool ?? []
    const decksJson: DeckRecord[] = raw.decks ?? []
    const fieldDefs: FieldDef[] = raw.fieldDefs ?? []
    const deckRules = raw.deckRules ?? {}
    const boardConfig: GameConfigJson = raw.boardConfig ?? (defaultBoardConfig as GameConfigJson)
    const profileName = raw.meta?.name ?? ''

    const activeDeckIndex = decksJson.length > 0 ? 0 : -1
    const globalUrl = get()._globalCardBackUrl
    set({
      cards: cardsJson,
      decks: decksJson,
      activeDeckIndex,
      imageUrls: {},
      cardBackUrl: effectiveCardBackUrl(decksJson, activeDeckIndex, globalUrl),
      fileHandle,
      profileName,
      fieldDefs,
      deckRules,
      boardConfig,
    })
    useLayoutStore.getState().setConfig(boardConfig)
  },

  exportGameProfile: () => {
    const { cards, decks, profileName, fieldDefs, deckRules, boardConfig } = get()
    const profile: GameProfile = {
      meta: { name: profileName || 'exported-profile', version: '1' },
      fieldDefs,
      deckRules,
      boardConfig,
      pool: cards,
      decks,
    }
    const filename = profileName ? `${profileName.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json` : 'game-profile.json'
    downloadJson(profile, filename)
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
    const { fileHandle, cards, decks, fieldDefs, deckRules, boardConfig } = get()
    if (!fileHandle) return
    const profile: GameProfile = {
      meta: { name: 'game-profile', version: '1' },
      fieldDefs,
      deckRules,
      boardConfig,
      pool: cards,
      decks,
    }
    await writeGameProfile(fileHandle, profile)
  },

  addCard: async (name, fields, imageFile?) => {
    const { fileHandle, cards, decks, fieldDefs, deckRules, boardConfig } = get()
    if (!fileHandle) throw new Error('No fileHandle')
    let image_data: string | undefined
    if (imageFile) {
      image_data = await fileToBase64(imageFile)
    }
    const newCard: Card = {
      id: crypto.randomUUID(),
      name,
      image_path: '',
      image_data,
      count: 1,
      fields,
    }
    const updated = [...cards, newCard]
    const profile: GameProfile = {
      meta: { name: 'game-profile', version: '1' },
      fieldDefs,
      deckRules,
      boardConfig,
      pool: updated,
      decks,
    }
    await writeGameProfile(fileHandle, profile)
    set({ cards: updated })
  },

  updateCard: async (id, name, fields, imageFile?) => {
    const { fileHandle, cards, decks, fieldDefs, deckRules, boardConfig } = get()
    if (!fileHandle) throw new Error('No fileHandle')
    let image_data: string | undefined
    if (imageFile) {
      image_data = await fileToBase64(imageFile)
    }
    const updated = cards.map(c =>
      c.id === id
        ? { ...c, name, fields, ...(image_data !== undefined ? { image_data } : {}) }
        : c
    )
    const profile: GameProfile = {
      meta: { name: 'game-profile', version: '1' },
      fieldDefs,
      deckRules,
      boardConfig,
      pool: updated,
      decks,
    }
    await writeGameProfile(fileHandle, profile)
    set({ cards: updated })
  },

  deleteCard: async (id) => {
    const { fileHandle, cards, decks, fieldDefs, deckRules, boardConfig } = get()
    if (!fileHandle) throw new Error('No fileHandle')
    const updated = cards.filter(c => c.id !== id)
    const updatedDecks = decks.map(d => ({
      ...d,
      cards: d.cards.filter(e => e.cardId !== id),
    }))
    const profile: GameProfile = {
      meta: { name: 'game-profile', version: '1' },
      fieldDefs,
      deckRules,
      boardConfig,
      pool: updated,
      decks: updatedDecks,
    }
    await writeGameProfile(fileHandle, profile)
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

  applyLibrarySnapshot: (cards, decks, activeDeckIndex, fieldDefs?, deckRules?, boardConfig?, profileName?) => {
    const { _globalCardBackUrl } = get()
    set({
      cards,
      decks,
      activeDeckIndex,
      cardBackUrl: effectiveCardBackUrl(decks, activeDeckIndex, _globalCardBackUrl),
      ...(fieldDefs !== undefined ? { fieldDefs } : {}),
      ...(deckRules !== undefined ? { deckRules } : {}),
      ...(boardConfig !== undefined ? { boardConfig } : {}),
      ...(profileName !== undefined ? { profileName } : {}),
    })
  },
}))
