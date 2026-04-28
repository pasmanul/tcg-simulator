import { useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useGameStore } from '../../store/gameStore'
import type { GameCard } from '../../domain/types'
import { Dialog } from '../components/Dialog'
import { Button } from '../components/Button'

export function StackDialog() {
  const { stackInfo, closeStackDialog, addLog } = useUIStore(s => ({
    stackInfo: s.stackInfo,
    closeStackDialog: s.closeStackDialog,
    addLog: s.addLog,
  }))
  const { zones, unstackCard } = useGameStore(s => ({
    zones: s.zones,
    unstackCard: s.unstackCard,
  }))

  // 最新状態のカードをストアから取得（ダイアログ表示後に変化している可能性があるため）
  const topCard = stackInfo
    ? zones[stackInfo.zoneId]?.cards.find(c => c.instanceId === stackInfo.gc.instanceId)
    : undefined

  // ゾーンやカードが消えていたら自動クローズ
  useEffect(() => {
    if (stackInfo && !topCard) closeStackDialog()
  }, [stackInfo, topCard, closeStackDialog])

  const allCards: GameCard[] = stackInfo && topCard ? [topCard, ...topCard.under_cards] : []

  function handleDetach(gc: GameCard, index: number) {
    if (index === 0) return // トップカードは切り離さない
    unstackCard(stackInfo!.zoneId, topCard!.instanceId, gc.instanceId)
    addLog(`${gc.card.name} をスタックから切り離し`)
    closeStackDialog()
  }

  return (
    <Dialog
      open={!!stackInfo && !!topCard}
      onClose={closeStackDialog}
      title={`STACK (${allCards.length})`}
      width="max-w-sm"
    >
      <div className="flex flex-col gap-3">
        <p className="text-muted text-[11px] font-body">
          上から順に表示。「切り離す」でゾーンに戻します。
        </p>

        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {allCards.map((gc, i) => (
            <div
              key={gc.instanceId}
              className="flex items-center gap-2.5 px-3 py-2 rounded-theme border border-primary/15 bg-surface2"
            >
              {/* Index badge */}
              <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-white font-mono border border-white/10
                ${i === 0 ? 'bg-orange-500' : 'bg-slate-800'}`}
              >
                {i + 1}
              </div>

              <div className="flex-1">
                <span className="text-text-base text-[13px] font-body">{gc.card.name}</span>
              </div>

              {i > 0 ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDetach(gc, i)}
                >
                  切り離す
                </Button>
              ) : (
                <span className="text-[10px] text-orange-400 font-mono ml-auto">TOP</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={closeStackDialog}>閉じる</Button>
        </div>
      </div>
    </Dialog>
  )
}
