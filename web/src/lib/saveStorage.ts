import type { GameStateSnapshot } from '../domain/types'

async function getSavesDir(
  dirHandle: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> {
  return dirHandle.getDirectoryHandle('saves', { create: true })
}

export async function listSaveFiles(
  dirHandle: FileSystemDirectoryHandle,
): Promise<string[]> {
  const savesDir = await getSavesDir(dirHandle)
  const names: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const [name] of (savesDir as any).entries()) {
    if (typeof name === 'string' && name.endsWith('.json')) {
      names.push(name.slice(0, -5))
    }
  }
  return names.sort().reverse() // 新しい順
}

export async function writeSaveFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  snapshot: GameStateSnapshot,
): Promise<void> {
  const savesDir = await getSavesDir(dirHandle)
  const fileHandle = await savesDir.getFileHandle(`${filename}.json`, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(snapshot, null, 2))
  await writable.close()
}

export async function readSaveFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<GameStateSnapshot> {
  const savesDir = await getSavesDir(dirHandle)
  const fileHandle = await savesDir.getFileHandle(`${filename}.json`)
  const file = await fileHandle.getFile()
  return JSON.parse(await file.text()) as GameStateSnapshot
}

/** dirHandle 未設定時のフォールバック: JSON をダウンロード */
export function downloadSnapshot(snapshot: GameStateSnapshot, filename: string): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** dirHandle 未設定時のフォールバック: ファイル選択して読み込む */
export async function uploadSnapshot(): Promise<GameStateSnapshot | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) { resolve(null); return }
      try {
        const text = await file.text()
        resolve(JSON.parse(text) as GameStateSnapshot)
      } catch {
        resolve(null)
      }
    }
    input.click()
  })
}
