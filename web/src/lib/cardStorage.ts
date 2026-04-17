import type { DeckPoolJson } from '../domain/types'

type WritableHandle = FileSystemFileHandle & { createWritable(): Promise<FileSystemWritableFileStream> }

export async function writeDeckPoolJson(
  dirHandle: FileSystemDirectoryHandle,
  data: DeckPoolJson,
): Promise<void> {
  const fh = await dirHandle.getFileHandle('deck.json', { create: true })
  const writable = await (fh as WritableHandle).createWritable()
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
}

export async function readDeckPoolJson(
  dirHandle: FileSystemDirectoryHandle,
): Promise<DeckPoolJson> {
  const fh = await dirHandle.getFileHandle('deck.json')
  const file = await fh.getFile()
  const raw = JSON.parse(await file.text())
  return {
    pool: raw.pool ?? [],
    decks: raw.decks ?? (raw.deck ? [{ name: '無題', cards: raw.deck }] : []),
  }
}

/** 画像を cards/ サブフォルダにコピーして 'cards/filename.ext' を返す（旧形式移行用） */
export async function saveImageToCards(
  dirHandle: FileSystemDirectoryHandle,
  file: File,
): Promise<string> {
  const cardsDir = await dirHandle.getDirectoryHandle('cards', { create: true })
  const dot = file.name.lastIndexOf('.')
  const base = dot !== -1 ? file.name.slice(0, dot) : file.name
  const ext  = dot !== -1 ? file.name.slice(dot) : ''
  const filename = `${base}_${Date.now()}${ext}`
  const fh = await cardsDir.getFileHandle(filename, { create: true })
  const writable = await (fh as WritableHandle).createWritable()
  await writable.write(await file.arrayBuffer())
  await writable.close()
  return `cards/${filename}`
}
