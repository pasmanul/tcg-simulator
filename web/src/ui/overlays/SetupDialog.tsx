import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useLibraryStore } from '../../store/libraryStore'
import { useGameStore } from '../../store/gameStore'
import { buildDeckFromLibrary } from '../../domain/gameLogic'
import { pickAndLoadLibrary, restoreLibrary, initNewLibrary } from '../../lib/imageCache'

export function SetupDialog() {
  const { activeDialog, closeDialog } = useUIStore(s => ({
    activeDialog: s.activeDialog,
    closeDialog: s.closeDialog,
  }))
  const { loadLibrary, setCardBack } = useLibraryStore(s => ({
    loadLibrary: s.loadLibrary,
    setCardBack: s.setCardBack,
  }))
  const initializeField = useGameStore(s => s.initializeField)
  const addLog = useUIStore(s => s.addLog)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  function tryInitField() {
    const s = useLibraryStore.getState()
    const deckCards = buildDeckFromLibrary(s.cards, s.currentDeck())
    if (deckCards.length > 0) {
      initializeField(deckCards)
      addLog(`フィールド初期化 — ${deckCards.length}枚`)
    }
  }

  if (activeDialog !== 'setup') return null

  async function handlePickFolder() {
    setLoading(true)
    setStatus('フォルダを選択中...')
    const result = await pickAndLoadLibrary()
    if (result) {
      loadLibrary(result.cardsJson, result.decksJson, result.fileMap, result.dirHandle)
      if (result.cardBackUrl) setCardBack(result.cardBackUrl)
      tryInitField()
      setStatus(`✓ ${result.cardsJson.length}枚のカードを読み込みました`)
    } else {
      setStatus('キャンセルされました')
    }
    setLoading(false)
  }

  async function handleInit() {
    setLoading(true)
    setStatus('新規フォルダを初期化中...')
    const result = await initNewLibrary()
    if (result) {
      loadLibrary(result.cardsJson, result.decksJson, result.fileMap, result.dirHandle)
      setStatus('✓ 空のライブラリを初期化しました（deck.json を作成）')
    } else {
      setStatus('キャンセルされました')
    }
    setLoading(false)
  }

  async function handleRestore() {
    setLoading(true)
    setStatus('前回のフォルダを復元中...')
    const result = await restoreLibrary()
    if (result) {
      loadLibrary(result.cardsJson, result.decksJson, result.fileMap, result.dirHandle)
      if (result.cardBackUrl) setCardBack(result.cardBackUrl)
      tryInitField()
      setStatus(`✓ ${result.cardsJson.length}枚のカードを復元しました`)
    } else {
      setStatus('前回のフォルダが見つかりません')
    }
    setLoading(false)
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

  const dialog: React.CSSProperties = {
    background: '#0e1228',
    border: '1px solid rgba(124,58,237,0.5)',
    borderRadius: 16,
    padding: 32,
    width: 460,
    boxShadow: '0 0 60px rgba(124,58,237,0.3)',
    fontFamily: "'Chakra Petch', sans-serif",
  }

  const btnStyle: React.CSSProperties = {
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
      <div style={dialog} onClick={e => e.stopPropagation()}>
        <h2 style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 14,
          color: '#00FFFF',
          textShadow: '0 0 20px rgba(0,255,255,0.7)',
          marginBottom: 8,
          lineHeight: 1.6,
        }}>
          CARD LIBRARY
        </h2>

        <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 24, lineHeight: 1.7 }}>
          既存のカードフォルダを選択するか、<br />
          空のフォルダで新規セットアップしてください。
        </p>

        <button
          style={{
            ...btnStyle,
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            color: '#fff',
            border: 'none',
          }}
          disabled={loading}
          onClick={handlePickFolder}
        >
          フォルダを選択
        </button>

        <button
          style={{
            ...btnStyle,
            background: 'transparent',
            color: '#A78BFA',
            border: '1px solid #7C3AED',
          }}
          disabled={loading}
          onClick={handleRestore}
        >
          前回のフォルダを復元
        </button>

        <button
          style={{
            ...btnStyle,
            background: 'transparent',
            color: '#44bbaa',
            border: '1px solid #227766',
          }}
          disabled={loading}
          onClick={handleInit}
        >
          新規セットアップ（空フォルダ）
        </button>

        {status && (
          <p style={{
            color: status.startsWith('✓') ? '#66dd88' : '#94A3B8',
            fontSize: 11,
            textAlign: 'center',
            marginTop: 8,
          }}>
            {status}
          </p>
        )}

        <button
          style={{
            ...btnStyle,
            background: 'transparent',
            color: '#505c78',
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
