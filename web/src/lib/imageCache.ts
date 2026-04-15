// File System Access API + IndexedDB for card image persistence

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
  cardsJson: import('../domain/types').Card[]
  fileMap: Map<string, string>  // image_path -> objectURL
  cardBackUrl: string
  dirHandle: FileSystemDirectoryHandle
}

export async function loadLibraryFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
): Promise<LoadedLibrary> {
  // Read cards.json
  const cardsFileHandle = await dirHandle.getFileHandle('cards.json')
  const cardsFile = await cardsFileHandle.getFile()
  const cardsJson = JSON.parse(await cardsFile.text())

  // Read back.jpg
  let cardBackUrl = ''
  try {
    const backHandle = await dirHandle.getFileHandle('back.jpg')
    const backFile = await backHandle.getFile()
    cardBackUrl = URL.createObjectURL(backFile)
  } catch {
    // back.jpg not found, use empty
  }

  // Read cards/ directory
  const fileMap = new Map<string, string>()
  try {
    const cardsDir = await dirHandle.getDirectoryHandle('cards')
    for await (const [name, entry] of (cardsDir as FileSystemDirectoryHandle & {
      entries(): AsyncIterable<[string, FileSystemHandle]>
    }).entries()) {
      if (entry.kind === 'file' && /\.(jpg|jpeg|png|webp)$/i.test(name)) {
        const fileHandle = entry as FileSystemFileHandle
        const file = await fileHandle.getFile()
        fileMap.set(`cards/${name}`, URL.createObjectURL(file))
      }
    }
  } catch {
    // cards/ not found
  }

  return { cardsJson, fileMap, cardBackUrl, dirHandle }
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

export async function restoreLibrary(): Promise<LoadedLibrary | null> {
  const handle = await loadDirectoryHandle()
  if (!handle) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handle as any
    const perm = await h.queryPermission({ mode: 'read' })
    if (perm === 'granted') return loadLibraryFromDirectory(handle)
    const req = await h.requestPermission({ mode: 'read' })
    if (req === 'granted') return loadLibraryFromDirectory(handle)
  } catch {
    // permission denied
  }
  return null
}
