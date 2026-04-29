import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { syncBoardConfigToLibrary } from '../../lib/boardConfigSync'
import { useTabSync } from '../../sync/useTabSync'
import { useCardHotkeys } from '../hooks/useCardHotkeys'
import type { GameCard, Card, GameConfigJson } from '../../domain/types'
import { BoardStage } from '../stage/BoardStage'
import { BoardHud } from '../hud/BoardHud'
import { ActionLog } from '../overlays/ActionLog'
import { ContextMenu } from '../overlays/ContextMenu'
import { GameLoadDialog } from '../overlays/GameLoadDialog'
import { SearchDialog } from '../overlays/SearchDialog'
import { DiceDialog } from '../overlays/DiceDialog'
import { StackDialog } from '../overlays/StackDialog'
import { SaveLoadDialog } from '../overlays/SaveLoadDialog'
import { DeckDropDialog } from '../overlays/DeckDropDialog'
import { CardZoomOverlay } from '../overlays/CardZoomOverlay'
import { GameSetupWizard } from '../overlays/GameSetupWizard'
import { BoardSidebar, type SidebarItem } from '../overlays/BoardSidebar'
import { BoardEditorDialog } from '../overlays/BoardEditorDialog'
import { FieldEditorDialog } from '../overlays/FieldEditorDialog'
import { ThemeDialog } from '../overlays/ThemeDialog'
import { DeckPage } from './DeckPage'
import { PAGE_CLASSES } from '../pageLayout'

function makeDummyCard(index: number): GameCard {
  const card: Card = {
    id: `dummy-${index}`,
    name: `ダミー ${index + 1}`,
    image_path: '',
    count: 1,
    fields: {},
  }
  return {
    instanceId: crypto.randomUUID(),
    card,
    tapped: false,
    face_down: false,
    revealed: false,
    row: 0,
    marker: null,
    under_cards: [],
  }
}

export function BoardPage() {
  useTabSync('board')
  useCardHotkeys()

  const [boardEditorOpen, setBoardEditorOpen] = useState(false)

  const initZones = useGameStore(s => s.initZones)
  const addZoneToGame = useGameStore(s => s.addZoneToGame)
  const { zones: layoutZones, windows: layoutWindows, addZone: addLayoutZone } = useLayoutStore(s => ({
    zones: s.zones,
    windows: s.windows,
    addZone: s.addZone,
  }))
  const { deckPanelOpen, closeDeckPanel, setEditingZoneId } = useUIStore(s => ({
    deckPanelOpen: s.deckPanelOpen,
    closeDeckPanel: s.closeDeckPanel,
    setEditingZoneId: s.setEditingZoneId,
  }))

  function handleAddZone() {
    const newZone = addLayoutZone('board')
    addZoneToGame(newZone.id)
    syncBoardConfigToLibrary()
    setEditingZoneId(newZone.id)
  }

  const sidebarItems: SidebarItem[] = [
    {
      icon: '✨',
      label: 'NEW GAME',
      description: '新規ゲーム作成',
      onClick: () => { useUIStore.getState().openDialog('setup-wizard'); useUIStore.getState().closeSidebar() },
    },
    {
      icon: '📂',
      label: 'FILE LOAD',
      description: 'ゲームプロファイル読込',
      onClick: () => { useUIStore.getState().openDialog('setup'); useUIStore.getState().closeSidebar() },
    },
    {
      icon: '🏷',
      label: 'CARD FIELDS',
      description: 'カード属性フィールド編集',
      onClick: () => { useUIStore.getState().openDialog('field-editor'); useUIStore.getState().closeSidebar() },
    },
    {
      icon: '⚙',
      label: 'BOARD EDIT',
      description: 'ゾーン詳細設定',
      onClick: () => { setBoardEditorOpen(true); useUIStore.getState().closeSidebar() },
    },
    {
      icon: '🎨',
      label: 'THEME',
      description: 'カラーテーマ変更',
      onClick: () => { useUIStore.getState().openDialog('theme'); useUIStore.getState().closeSidebar() },
    },
  ]

  function handleBoardEditorSave(config: GameConfigJson) {
    useLayoutStore.getState().setConfig(config)
    useLibraryStore.getState().applyLibrarySnapshot(
      useLibraryStore.getState().cards,
      useLibraryStore.getState().decks,
      useLibraryStore.getState().activeDeckIndex,
      undefined, undefined, config,
    )
    setBoardEditorOpen(false)
  }

  useEffect(() => {
    const realZoneIds = layoutZones
      .filter(z => z.window_id === 'board' && !z.source_zone_id && !z.ui_widget)
      .map(z => z.id)
    const handZoneIds = layoutZones
      .filter(z => !z.source_zone_id && !z.ui_widget)
      .map(z => z.id)
    initZones([...new Set([...realZoneIds, ...handZoneIds])])

    // カードライブラリ未ロード時はダミーデッキで動作確認できるよう初期配置
    if (useLibraryStore.getState().cards.length === 0) {
      const dummy = Array.from({ length: 40 }, (_, i) => makeDummyCard(i))
      useGameStore.setState(s => ({
        zones: {
          ...s.zones,
          deck:   { zoneId: 'deck',   cards: dummy.slice(0, 30) },
          hand:   { zoneId: 'hand',   cards: dummy.slice(30, 35) },
          shield: { zoneId: 'shield', cards: dummy.slice(35, 40).map(c => ({ ...c, face_down: true })) },
        },
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={PAGE_CLASSES}>
      {/* HUD bar */}
      <BoardHud />

      {/* Main content: stage + action log */}
      <div className="flex flex-1 overflow-hidden">
        <BoardStage />

        {/* Action log sidebar */}
        <div className="w-48 flex-shrink-0 border-l border-border overflow-y-auto">
          <ActionLog />
        </div>
      </div>

      {/* Overlays */}
      <ContextMenu />
      <GameLoadDialog />
      <SearchDialog />
      <DiceDialog />
      <StackDialog />
      <SaveLoadDialog />
      <DeckDropDialog />
      <CardZoomOverlay />
      <GameSetupWizard />
      <FieldEditorDialog />
      <ThemeDialog />
      <BoardSidebar items={sidebarItems} />
      {boardEditorOpen && (
        <BoardEditorDialog
          initialConfig={{ windows: layoutWindows, zones: layoutZones }}
          onSave={handleBoardEditorSave}
          onClose={() => setBoardEditorOpen(false)}
        />
      )}

      {/* ゾーン追加ボタン */}
      <button
        onClick={handleAddZone}
        style={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #065f46, #047857)',
          border: '1px solid #34d399',
          color: '#6ee7b7',
          fontSize: 24,
          cursor: 'pointer',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(52,211,153,0.4)',
        }}
        aria-label="ゾーン追加"
      >+</button>

      {/* デッキビルダーパネル */}
      {deckPanelOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
          }}
          onClick={closeDeckPanel}
        >
          <div
            style={{
              width: '88vw',
              height: '88vh',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(var(--purple-rgb),0.4)',
              border: '1px solid rgba(var(--purple-rgb),0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <DeckPage />
          </div>
        </div>
      )}
    </div>
  )
}
