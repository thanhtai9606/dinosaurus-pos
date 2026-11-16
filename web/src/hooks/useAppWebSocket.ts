import { useEffect, useRef, useState, useCallback } from 'react';
import { buildWebSocketUrl } from '@/lib/config';

type WebSocketEvent = {
  type: string;
  payload: any;
};

type UseAppWebSocketOptions = {
  /** When false, disconnect and skip reconnect (e.g. logged out). */
  enabled?: boolean
}

export const useAppWebSocket = (
  onMessage: (event: WebSocketEvent) => void,
  options?: UseAppWebSocketOptions,
) => {
  const enabled = options?.enabled ?? true
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const openWebSocketRef = useRef<(url: string) => void>(() => {});

  openWebSocketRef.current = (wsUrl: string) => {
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0; // Reset reconnect count on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          onMessage(data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        ws.close();
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      scheduleReconnect();
    }
  }

  const connect = useCallback(() => {
    if (!enabled) return
    const wsUrl = buildWebSocketUrl();
    openWebSocketRef.current(wsUrl);
  }, [enabled]);

  const scheduleReconnect = useCallback(() => {
    if (!enabled) return
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
    reconnectCountRef.current += 1;
    
    reconnectTimeoutRef.current = setTimeout(() => {
        connect();
    }, delay);
  }, [connect, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Prevent onclose from triggering reconnect during unmount cleanup
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect, enabled]);

  return { isConnected };
};
