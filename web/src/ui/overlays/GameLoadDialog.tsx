import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { useSkin } from '../skin/SkinContext'

export function GameLoadDialog() {
  const { Button, Dialog } = useSkin()
  const { activeDialog, closeDialog, openDialog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
    openDialog: s.openDialog,
  }))

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

  const handleNewGame = () => openDialog('setup-wizard')

  return (
    <Dialog
      open={activeDialog === 'setup'}
      onClose={closeDialog}
      title="GAME PROFILE"
      width="max-w-md"
      className="!bg-surface2 !border-[rgba(var(--purple-rgb),0.5)] shadow-[0_0_60px_rgba(var(--purple-rgb),0.3)]"
    >
      <p className="font-body text-sm leading-relaxed mb-6" style={{ color: 'var(--text)' }}>
        既存のゲームプロファイルを開くか、<br />
        新規ゲームをセットアップしてください。
      </p>

      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', border: 'none', width: '100%' }}
          onClick={handleOpenFile}
        >
          既存プロファイルを開く
        </Button>

        <Button
          variant="secondary"
          style={{ background: 'transparent', color: 'var(--cyan)', border: '1px solid rgba(var(--cyan-rgb),0.4)', width: '100%' }}
          onClick={handleNewGame}
        >
          新規ゲームを作成
        </Button>

        <Button
          variant="ghost"
          style={{ color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
          onClick={closeDialog}
        >
          閉じる
        </Button>
      </div>
    </Dialog>
  )
}
