import type { GameStateSnapshot } from '../domain/types'

/** JSON をダウンロードして保存する */
export function downloadSnapshot(snapshot: GameStateSnapshot, filename: string): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** ファイル選択で JSON snapshot を読み込む */
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
