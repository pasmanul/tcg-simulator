import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { useLibraryStore } from '../../store/libraryStore'
import {
  listSaveFiles, writeSaveFile, readSaveFile,
  downloadSnapshot, uploadSnapshot,
} from '../../lib/saveStorage'

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

  if (activeDialog !== 'save-load') return null

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

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  }
  const dialog: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid rgba(var(--purple-rgb),0.4)',
    borderRadius: 12,
    padding: 24,
    width: 420,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
    fontFamily: "'Chakra Petch', sans-serif",
  }
  const tabBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    padding: '7px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--purple)' : 'rgba(var(--purple-rgb),0.3)'}`,
    background: active ? '#4c1d95' : 'var(--surface2)',
    color: active ? 'var(--purple-lite)' : 'var(--muted)',
    transition: 'all 150ms',
  })
  const input: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid rgba(var(--purple-rgb),0.3)',
    borderRadius: 6,
    color: 'var(--text)',
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: "'Chakra Petch', sans-serif",
    outline: 'none',
    width: '100%',
  }
  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    border: 'none',
    background: '#4c1d95',
    color: 'var(--purple-lite)',
    transition: 'all 150ms',
  }

  return (
    <div style={overlay} onClick={closeDialog}>
      <div style={dialog} onClick={e => e.stopPropagation()}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 11,
          color: 'var(--cyan)',
          textShadow: '0 0 10px rgba(var(--cyan-rgb),0.5)',
        }}>
          SAVE / LOAD
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={tabBtn(tab === 'save')} onClick={() => setTab('save')}>SAVE</button>
          <button style={tabBtn(tab === 'load')} onClick={() => setTab('load')}>LOAD</button>
        </div>

        {/* セーブタブ */}
        {tab === 'save' && (
          <>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 6 }}>ファイル名</div>
              <input
                style={input}
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                autoFocus
              />
            </div>
            {!dirHandle && (
              <div style={{ color: 'var(--warning)', fontSize: 11 }}>
                ※ ライブラリフォルダ未設定のため、ダウンロードとして保存します
              </div>
            )}
            <button
              style={btn}
              onMouseEnter={e => (e.currentTarget.style.background = '#5b21b6')}
              onMouseLeave={e => (e.currentTarget.style.background = '#4c1d95')}
              onClick={handleSave}
            >
              保存
            </button>
          </>
        )}

        {/* ロードタブ */}
        {tab === 'load' && (
          <>
            {dirHandle && saveList.length > 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                maxHeight: 240, overflowY: 'auto',
                border: '1px solid rgba(var(--purple-rgb),0.15)',
                borderRadius: 6,
              }}>
                {saveList.map(name => (
                  <div
                    key={name}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontSize: 12,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 100ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--purple-rgb),0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                    onClick={() => handleLoad(name)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
            {dirHandle && saveList.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 16 }}>
                保存データがありません
              </div>
            )}
            <button
              style={{ ...btn, background: '#1a1a2e', color: 'var(--text)', border: '1px solid #303050' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#22223a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
              onClick={handleUploadLoad}
            >
              ファイルから読み込む
            </button>
          </>
        )}

        {/* ステータス */}
        {status && (
          <div style={{ color: 'var(--success)', fontSize: 12 }}>{status}</div>
        )}

        <button
          onClick={closeDialog}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--muted)', cursor: 'pointer',
            fontSize: 11, fontFamily: "'Chakra Petch', sans-serif",
            alignSelf: 'flex-end',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
