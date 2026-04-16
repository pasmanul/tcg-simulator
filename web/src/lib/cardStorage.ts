import type { Card } from '../domain/types'

type WritableHandle = FileSystemFileHandle & { createWritable(): Promise<FileSystemWritableFileStream> }

export async function writeCardsJson(
  dirHandle: FileSystemDirectoryHandle,
  cards: Card[],
): Promise<void> {
  const fh = await dirHandle.getFileHandle('cards.json', { create: true })
  const writable = await (fh as WritableHandle).createWritable()
  await writable.write(JSON.stringify(cards, null, 2))
  await writable.close()
}

/** 画像を cards/ サブフォルダにコピーして 'cards/filename.ext' を返す */
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
