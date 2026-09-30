/**
 * hooks/useWebSocket.js
 *
 * Realtime synchronization hook for NETRA.
 * Connects to Supabase Realtime postgres_changes broadcast channels
 * so that any newly inserted/updated alerts or vehicle sightings
 * appear immediately across all connected browser tabs without page refresh.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'

const WS_STATES = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
}

/**
 * @param {string}   [channelName='netra-realtime'] - Realtime channel identifier
 * @param {object}   [options]
 * @param {boolean}  [options.enabled=true] - Set to true to activate Realtime listener
 * @param {Function} [options.onMessage]    - Invoked when an event or row change arrives
 */
export function useWebSocket(channelName = 'netra-realtime', { enabled = true, onMessage } = {}) {
  const [status, setStatus] = useState(WS_STATES.CLOSED)
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !supabase) {
      setStatus(WS_STATES.CLOSED)
      return
    }

    setStatus(WS_STATES.CONNECTING)

    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'alerts' },
          (payload) => {
            const message = {
              type: `alert_${payload.eventType.toLowerCase()}`,
              table: 'alerts',
              eventType: payload.eventType,
              data: payload.new || payload.old,
              timestamp: new Date().toISOString(),
            }
            setLastMessage(message)
            onMessage?.(message)
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'vehicle_sightings' },
          (payload) => {
            const message = {
              type: 'sighting_new',
              table: 'vehicle_sightings',
              data: payload.new,
              timestamp: new Date().toISOString(),
            }
            setLastMessage(message)
            onMessage?.(message)
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'cameras' },
          (payload) => {
            const message = {
              type: 'camera_update',
              table: 'cameras',
              data: payload.new,
              timestamp: new Date().toISOString(),
            }
            setLastMessage(message)
            onMessage?.(message)
          }
        )
        .subscribe((subscriptionStatus) => {
          if (subscriptionStatus === 'SUBSCRIBED') {
            setStatus(WS_STATES.OPEN)
          } else if (subscriptionStatus === 'CLOSED') {
            setStatus(WS_STATES.CLOSED)
          } else if (subscriptionStatus === 'CHANNEL_ERROR') {
            setStatus(WS_STATES.CLOSED)
            setError(new Error('Realtime channel error'))
          }
        })

      channelRef.current = channel

      return () => {
        setStatus(WS_STATES.CLOSING)
        supabase.removeChannel(channel)
        setStatus(WS_STATES.CLOSED)
      }
    } catch (err) {
      setError(err)
      setStatus(WS_STATES.CLOSED)
    }
  }, [enabled, channelName, onMessage])

  const sendMessage = useCallback((data) => {
    if (channelRef.current && status === WS_STATES.OPEN) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'user_action',
        payload: data,
      })
    }
  }, [status])

  const disconnect = useCallback(() => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current)
      setStatus(WS_STATES.CLOSED)
    }
  }, [])

  return {
    status,
    isConnected: status === WS_STATES.OPEN,
    lastMessage,
    error,
    sendMessage,
    disconnect,
  }
}

export default useWebSocket
