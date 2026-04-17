import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import type { GameStateSnapshot } from '../domain/types'

type TabRole = 'board' | 'hand'

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
  ts: number
}

type ChannelMsg = StateUpdateMsg | PingMsg | PongMsg

const CHANNEL_NAME = 'tcg-simulator-v1'

export function useTabSync(role: TabRole) {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const applySnapshot = useGameStore(s => s._applySnapshot)
  const zonesRef = useRef(useGameStore.getState().zones)
  const isApplyingRemoteRef = useRef(false)

  function applyRemoteSnapshot(snapshot: GameStateSnapshot) {
    isApplyingRemoteRef.current = true
    applySnapshot(snapshot)
    isApplyingRemoteRef.current = false
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
      if (msg.from === role) return  // ignore own messages

      if (msg.type === 'STATE_UPDATE') {
        applyRemoteSnapshot(msg.snapshot)
      }

      if (msg.type === 'PING') {
        // Reply with current state
        const pong: PongMsg = {
          type: 'PONG',
          from: role,
          snapshot: { zones: zonesRef.current },
          ts: Date.now(),
        }
        channel.postMessage(pong)
      }

      if (msg.type === 'PONG') {
        applyRemoteSnapshot(msg.snapshot)
      }
    }

    // Send PING on mount to sync with existing tab
    const ping: PingMsg = { type: 'PING', from: role, ts: Date.now() }
    channel.postMessage(ping)

    return () => channel.close()
  }, [role, applySnapshot])

  // Broadcast state changes to other tab (skip remote-applied snapshots to prevent echo loop)
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
}
