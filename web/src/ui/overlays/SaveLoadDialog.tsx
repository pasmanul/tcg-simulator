import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import {
  listSaveFiles, writeSaveFile, readSaveFile,
  downloadSnapshot, uploadSnapshot,
} from '../../lib/saveStorage'
import { Dialog } from '../components/Dialog'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

export function SaveLoadDialog() {
  const { activeDialog, closeDialog, addLog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    addLog: s.addLog,
  }))
  const { zones, loadSnapshot } = useGameStore(s => ({
    zones: s.zones,
    loadSnapshot: s.loadSnapshot,
  }))
  const dirHandle = null  // GameProfile形式ではフォルダハンドル不要。セーブはダウンロード/アップロードで対応

  const [tab, setTab] = useState<'save' | 'load'>('save')
  const [saveName, setSaveName] = useState(() => {
    const now = new Date()
    return `save_${now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`
  })
  const [saveList, setSaveList] = useState<string[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (activeDialog !== 'save-load') return
    setSaveName(`save_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`)
    if (dirHandle) {
      listSaveFiles(dirHandle).then(setSaveList).catch(() => setSaveList([]))
    }
  }, [activeDialog, dirHandle])

  const snapshot = { zones }

  async function handleSave() {
    const name = saveName.trim() || 'save'
    try {
      if (dirHandle) {
        await writeSaveFile(dirHandle, name, snapshot)
        const updated = await listSaveFiles(dirHandle)
        setSaveList(updated)
      } else {
        downloadSnapshot(snapshot, name)
      }
      addLog(`ゲームを保存: ${name}`)
      setStatus('保存しました')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('保存に失敗しました')
    }
  }

  async function handleLoad(filename: string) {
    try {
      if (dirHandle) {
        const snap = await readSaveFile(dirHandle, filename)
        loadSnapshot(snap)
        addLog(`ゲームをロード: ${filename}`)
      }
      closeDialog()
    } catch {
      setStatus('読み込みに失敗しました')
    }
  }

  async function handleUploadLoad() {
    const snap = await uploadSnapshot()
    if (!snap) return
    loadSnapshot(snap)
    addLog('ゲームをロード（ファイル選択）')
    closeDialog()
  }

  return (
    <Dialog
      open={activeDialog === 'save-load'}
      onClose={closeDialog}
      title="SAVE / LOAD"
      width="max-w-md"
    >
      <div className="flex flex-col gap-3.5">
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={tab === 'save' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTab('save')}
          >
            SAVE
          </Button>
          <Button
            variant={tab === 'load' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTab('load')}
          >
            LOAD
          </Button>
        </div>

        {/* Save tab */}
        {tab === 'save' && (
          <>
            <Input
              label="ファイル名"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              autoFocus
            />
            {!dirHandle && (
              <p className="text-yellow-400 text-[11px] font-body">
                ※ ライブラリフォルダ未設定のため、ダウンロードとして保存します
              </p>
            )}
            <Button variant="primary" onClick={handleSave}>保存</Button>
          </>
        )}

        {/* Load tab */}
        {tab === 'load' && (
          <>
            {dirHandle && saveList.length > 0 && (
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto border border-primary/15 rounded-theme">
                {saveList.map(name => (
                  <div
                    key={name}
                    className="px-3 py-2 cursor-pointer text-text-base text-[12px] font-body border-b border-white/[0.04] transition-colors duration-100 hover:bg-primary/10"
                    onClick={() => handleLoad(name)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
            {dirHandle && saveList.length === 0 && (
              <p className="text-muted text-[12px] text-center p-4 font-body">保存データがありません</p>
            )}
            <Button variant="secondary" onClick={handleUploadLoad}>
              ファイルから読み込む
            </Button>
          </>
        )}

        {/* Status */}
        {status && (
          <p className="text-green-400 text-[12px] font-body">{status}</p>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={closeDialog}>閉じる</Button>
        </div>
      </div>
    </Dialog>
  )
}
