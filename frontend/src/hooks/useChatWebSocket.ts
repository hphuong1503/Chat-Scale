import { useEffect, useRef, useState, useCallback } from 'react';
import { getConfig } from '../config.ts';
import type { WSConnectionStatus } from '../types.ts';

interface UseChatWebSocketProps {
  roomId: string | null;
  accessToken: string | null;
  onNewMessageEvent: () => void;
}

export function useChatWebSocket({
  roomId,
  accessToken,
  onNewMessageEvent,
}: UseChatWebSocketProps) {
  const [status, setStatus] = useState<WSConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const lastEventTimeRef = useRef<number>(0);

  const connect = useCallback(() => {
    if (!roomId || !accessToken) {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Room or token cleared');
        wsRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Reconnecting');
      wsRef.current = null;
    }

    setStatus('connecting');
    const config = getConfig();
    const wsUrl = `${config.wsUrl}/ws/chat/${roomId}/?token=${encodeURIComponent(accessToken)}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        setStatus('connected');
      };

      socket.onmessage = () => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        try {
          // Event serves as a signal to refetch history
          const now = Date.now();
          // Coalesce rapid events within 100ms
          if (now - lastEventTimeRef.current > 100) {
            lastEventTimeRef.current = now;
            onNewMessageEvent();
          }
        } catch {
          // Ignore malformed message payloads
        }
      };

      socket.onerror = () => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        setStatus('error');
      };

      socket.onclose = () => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        setStatus('disconnected');
      };
    } catch {
      setStatus('error');
    }
  }, [roomId, accessToken, onNewMessageEvent]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    status,
    reconnect: connect,
  };
}
