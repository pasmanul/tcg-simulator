// File System Access API + IndexedDB for card image persistence
import type { Card, DeckRecord } from '../domain/types'

type WritableHandle = FileSystemFileHandle & { createWritable(): Promise<FileSystemWritableFileStream> }

const IDB_NAME = 'tcg-simulator'
const IDB_STORE = 'handles'
const DIR_HANDLE_KEY = 'cardDirHandle'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(handle, DIR_HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(DIR_HANDLE_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export interface LoadedLibrary {
  cardsJson: Card[]
  decksJson: DeckRecord[]
  fileMap: Map<string, string>  // image_path -> objectURL（旧形式用）
  cardBackUrl: string
  dirHandle: FileSystemDirectoryHandle
}

export async function loadLibraryFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
): Promise<LoadedLibrary> {
  let pool: Card[] = []
  let decks: DeckRecord[] = []
  const fileMap = new Map<string, string>()

  try {
    // 新形式: deck.json を読む
    const fh = await dirHandle.getFileHandle('deck.json')
    const raw = JSON.parse(await (await fh.getFile()).text())
    pool = raw.pool ?? []
    // decks 配列 or 旧 deck フィールドの後方互換
    if (Array.isArray(raw.decks)) {
      decks = raw.decks
    } else if (Array.isArray(raw.deck)) {
      decks = [{ name: '無題', cards: raw.deck }]
    }
  } catch {
    // 旧形式フォールバック: cards.json + decks/ + cards/
    try {
      const fh = await dirHandle.getFileHandle('cards.json')
      pool = JSON.parse(await (await fh.getFile()).text())
    } catch { /* cards.json もなし */ }

    try {
      const decksDir = await dirHandle.getDirectoryHandle('decks')
      for await (const [name, entry] of (decksDir as FileSystemDirectoryHandle & {
        entries(): AsyncIterable<[string, FileSystemHandle]>
      }).entries()) {
        if (typeof name === 'string' && name.endsWith('.json') && entry.kind === 'file') {
          const file = await (entry as FileSystemFileHandle).getFile()
          const raw = JSON.parse(await file.text())
          const cards = (raw.cards ?? []).map((e: Record<string, unknown>) => ({
            cardId: (e.cardId ?? e.id) as string,
            count: (e.count ?? 1) as number,
          }))
          decks.push({ name: raw.name ?? name.replace('.json', ''), cards })
        }
      }
    } catch { /* decks/ なし */ }

    // 旧形式: cards/ フォルダの画像を fileMap に追加
    try {
      const cardsDir = await dirHandle.getDirectoryHandle('cards')
      for await (const [name, entry] of (cardsDir as FileSystemDirectoryHandle & {
        entries(): AsyncIterable<[string, FileSystemHandle]>
      }).entries()) {
        if (entry.kind === 'file' && /\.(jpg|jpeg|png|webp)$/i.test(name)) {
          const file = await (entry as FileSystemFileHandle).getFile()
          fileMap.set(`cards/${name}`, URL.createObjectURL(file))
        }
      }
    } catch { /* cards/ なし */ }
  }

  // back.jpg
  let cardBackUrl = ''
  try {
    const backHandle = await dirHandle.getFileHandle('back.jpg')
    const backFile = await backHandle.getFile()
    cardBackUrl = URL.createObjectURL(backFile)
  } catch { /* back.jpg not found */ }

  return { cardsJson: pool, decksJson: decks, fileMap, cardBackUrl, dirHandle }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const win = window as any

export async function pickAndLoadLibrary(): Promise<LoadedLibrary | null> {
  try {
    if (!win.showDirectoryPicker) throw new Error('File System Access API not supported')
    const dirHandle: FileSystemDirectoryHandle = await win.showDirectoryPicker({ mode: 'readwrite' })
    await saveDirectoryHandle(dirHandle)
    return loadLibraryFromDirectory(dirHandle)
  } catch {
    return null
  }
}

export async function initNewLibrary(): Promise<LoadedLibrary | null> {
  try {
    if (!win.showDirectoryPicker) throw new Error('File System Access API not supported')
    const dirHandle: FileSystemDirectoryHandle = await win.showDirectoryPicker({ mode: 'readwrite' })
    // deck.json を空の状態で作成
    const fh = await dirHandle.getFileHandle('deck.json', { create: true })
    const w = await (fh as WritableHandle).createWritable()
    await w.write(JSON.stringify({ pool: [], deck: [] }, null, 2))
    await w.close()
    await saveDirectoryHandle(dirHandle)
    return { cardsJson: [], decksJson: [], fileMap: new Map(), cardBackUrl: '', dirHandle }
  } catch {
    return null
  }
}

export async function restoreLibrary(): Promise<LoadedLibrary | null> {
  const handle = await loadDirectoryHandle()
  if (!handle) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handle as any
    const perm = await h.queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return loadLibraryFromDirectory(handle)
    const req = await h.requestPermission({ mode: 'readwrite' })
    if (req === 'granted') return loadLibraryFromDirectory(handle)
  } catch {
    // permission denied
  }
  return null
}
