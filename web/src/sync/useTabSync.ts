import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { useLibraryStore } from '../store/libraryStore'
import type { GameStateSnapshot, Card, DeckRecord } from '../domain/types'

type TabRole = 'board' | 'hand'

interface LibrarySnapshot {
  cards: Card[]
  decks: DeckRecord[]
  activeDeckIndex: number
}

interface StateUpdateMsg {
  type: 'STATE_UPDATE'
  from: TabRole
  snapshot: GameStateSnapshot
  ts: number
}

interface PingMsg {
  type: 'PING'
  from: TabRole
  ts: number
}

interface PongMsg {
  type: 'PONG'
  from: TabRole
  snapshot: GameStateSnapshot
  library?: LibrarySnapshot
  ts: number
}

interface LibrarySyncMsg {
  type: 'LIBRARY_SYNC'
  from: TabRole
  library: LibrarySnapshot
}

type ChannelMsg = StateUpdateMsg | PingMsg | PongMsg | LibrarySyncMsg

const CHANNEL_NAME = 'tcg-simulator-v1'

export function useTabSync(role: TabRole) {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const applySnapshot = useGameStore(s => s._applySnapshot)
  const applyLibrarySnapshot = useLibraryStore(s => s.applyLibrarySnapshot)
  const zonesRef = useRef(useGameStore.getState().zones)
  const isApplyingRemoteRef = useRef(false)

  function applyRemoteSnapshot(snapshot: GameStateSnapshot) {
    isApplyingRemoteRef.current = true
    applySnapshot(snapshot)
    isApplyingRemoteRef.current = false
  }

  function applyRemoteLibrary(lib: LibrarySnapshot) {
    applyLibrarySnapshot(lib.cards, lib.decks, lib.activeDeckIndex)
  }

  function getLibrarySnapshot(): LibrarySnapshot {
    const s = useLibraryStore.getState()
    return { cards: s.cards, decks: s.decks, activeDeckIndex: s.activeDeckIndex }
  }

  // Keep zonesRef up to date
  useEffect(() => {
    return useGameStore.subscribe(s => {
      zonesRef.current = s.zones
    })
  }, [])

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (e: MessageEvent<ChannelMsg>) => {
      const msg = e.data
      if (msg.from === role) return

      if (msg.type === 'STATE_UPDATE') {
        applyRemoteSnapshot(msg.snapshot)
      }

      if (msg.type === 'PING') {
        const pong: PongMsg = {
          type: 'PONG',
          from: role,
          snapshot: { zones: zonesRef.current },
          library: getLibrarySnapshot(),
          ts: Date.now(),
        }
        channel.postMessage(pong)
      }

      if (msg.type === 'PONG') {
        applyRemoteSnapshot(msg.snapshot)
        // ライブラリはボード→手札の一方向のみ
        if (msg.library && role === 'hand') applyRemoteLibrary(msg.library)
      }

      if (msg.type === 'LIBRARY_SYNC') {
        // 手札のみ受信
        if (role === 'hand') applyRemoteLibrary(msg.library)
      }
    }

    const ping: PingMsg = { type: 'PING', from: role, ts: Date.now() }
    channel.postMessage(ping)

    return () => channel.close()
  }, [role, applySnapshot, applyLibrarySnapshot])

  // Broadcast gameStore changes
  useEffect(() => {
    return useGameStore.subscribe((s) => {
      if (!channelRef.current) return
      if (isApplyingRemoteRef.current) return
      const msg: StateUpdateMsg = {
        type: 'STATE_UPDATE',
        from: role,
        snapshot: { zones: s.zones },
        ts: Date.now(),
      }
      channelRef.current.postMessage(msg)
    })
  }, [role])

  // Board: broadcast libraryStore changes to hand
  useEffect(() => {
    if (role !== 'board') return
    return useLibraryStore.subscribe((s) => {
      if (!channelRef.current) return
      const msg: LibrarySyncMsg = {
        type: 'LIBRARY_SYNC',
        from: role,
        library: { cards: s.cards, decks: s.decks, activeDeckIndex: s.activeDeckIndex },
      }
      channelRef.current.postMessage(msg)
    })
  }, [role])
}
