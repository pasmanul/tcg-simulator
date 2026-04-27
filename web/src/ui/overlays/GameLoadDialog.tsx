import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'

export function GameLoadDialog() {
  const { activeDialog, closeDialog, openDialog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    openDialog: s.openDialog,
  }))

  if (activeDialog !== 'setup') return null

  const handleOpenFile = async () => {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Game Profile', accept: { 'application/json': ['.json'] } }],
      })
      await useLibraryStore.getState().loadGameProfile(fileHandle)
      closeDialog()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    }
  }

  const handleNewGame = () => {
    openDialog('setup-wizard')
  }

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  }

  const modal: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid rgba(var(--purple-rgb),0.5)',
    borderRadius: 16,
    padding: 32,
    width: 460,
    boxShadow: '0 0 60px rgba(var(--purple-rgb),0.3)',
    fontFamily: "'Chakra Petch', sans-serif",
  }

  const btnBase: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    padding: '12px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    width: '100%',
    marginBottom: 12,
    transition: 'all 150ms',
  }

  return (
    <div style={overlay} onClick={closeDialog}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <h2 style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 14,
          color: 'var(--cyan)',
          textShadow: '0 0 20px rgba(var(--cyan-rgb),0.7)',
          marginBottom: 8,
          lineHeight: 1.6,
        }}>
          GAME PROFILE
        </h2>

        <p style={{ color: 'var(--text)', fontSize: 12, marginBottom: 24, lineHeight: 1.7 }}>
          既存のゲームプロファイルを開くか、<br />
          新規ゲームをセットアップしてください。
        </p>

        <button
          style={{
            ...btnBase,
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            color: '#fff',
            border: 'none',
          }}
          onClick={handleOpenFile}
        >
          既存プロファイルを開く
        </button>

        <button
          style={{
            ...btnBase,
            background: 'transparent',
            color: '#44bbaa',
            border: '1px solid #227766',
          }}
          onClick={handleNewGame}
        >
          新規ゲームを作成
        </button>

        <button
          style={{
            ...btnBase,
            background: 'transparent',
            color: 'var(--muted)',
            border: '1px solid rgba(255,255,255,0.1)',
            marginTop: 8,
            marginBottom: 0,
          }}
          onClick={closeDialog}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
