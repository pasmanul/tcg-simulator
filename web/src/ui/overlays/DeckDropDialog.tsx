import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import { useSkin } from '../skin/SkinContext'

export function DeckDropDialog() {
  const { Button, Dialog } = useSkin()
  const { deckDropInfo, setDeckDropInfo, addLog } = useUIStore(s => ({
    deckDropInfo: s.deckDropInfo,
    setDeckDropInfo: s.setDeckDropInfo,
    addLog: s.addLog,
  }))
  const moveCard = useGameStore(s => s.moveCard)

  function handleChoose(top: boolean) {
    if (!deckDropInfo) return
    moveCard(deckDropInfo.fromZoneId, deckDropInfo.instanceId, 'deck', top ? 0 : undefined)
    addLog(`カード移動 → 山札（${top ? '上' : '下'}）`)
    setDeckDropInfo(null)
  }

  return (
    <Dialog
      open={!!deckDropInfo}
      onClose={() => setDeckDropInfo(null)}
      width="max-w-xs"
    >
      {/* タイトル */}
      <div
        className="font-mono text-[10px] text-center mb-2"
        style={{ color: 'var(--cyan)', textShadow: '0 0 10px rgba(var(--cyan-rgb),0.5)' }}
      >
        山札に追加
      </div>

      <div className="text-muted text-[12px] text-center mb-4">
        どこに追加しますか？
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={() => handleChoose(true)}>
          一番上
        </Button>
        <Button variant="secondary" onClick={() => handleChoose(false)}>
          一番下
        </Button>
      </div>
    </Dialog>
  )
}
