import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { downloadSnapshot, uploadSnapshot } from '../../lib/saveStorage'
import { useSkin } from '../skin/SkinContext'

export function SaveLoadDialog() {
  const { Button, Dialog, Input } = useSkin()
  const { activeDialog, closeDialog, addLog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    addLog: s.addLog,
  }))
  const { zones, loadSnapshot } = useGameStore(s => ({
    zones: s.zones,
    loadSnapshot: s.loadSnapshot,
  }))

  const [tab, setTab] = useState<'save' | 'load'>('save')
  const [saveName, setSaveName] = useState(() => {
    const now = new Date()
    return `save_${now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`
  })
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (activeDialog !== 'save-load') return
    setSaveName(`save_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`)
  }, [activeDialog])

  const snapshot = { zones }

  async function handleSave() {
    const name = saveName.trim() || 'save'
    try {
      downloadSnapshot(snapshot, name)
      addLog(`ゲームを保存: ${name}`)
      setStatus('保存しました')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('保存に失敗しました')
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
            <p className="text-yellow-400 text-[11px] font-body">
              ※ セーブデータは JSON ファイルとしてダウンロードします
            </p>
            <Button variant="primary" onClick={handleSave}>保存</Button>
          </>
        )}

        {/* Load tab */}
        {tab === 'load' && (
          <>
            <p className="text-muted text-[12px] font-body">
              保存済み JSON ファイルを選択して読み込みます。
            </p>
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
