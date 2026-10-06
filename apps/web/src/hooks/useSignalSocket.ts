import { useState, useEffect, useRef, useCallback } from 'react';

export interface Signal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  size: number;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface SocketStatePayload {
  event: 'INITIAL_STATE' | 'SIGNAL_UPDATED' | 'pong';
  active_signals?: Signal[];
  history?: Signal[];
  signal?: Signal;
  action?: 'APPROVED' | 'REJECTED';
}

interface UseSignalSocketOptions {
  url?: string;
  gatewayApiUrl?: string;
  maxReconnectAttempts?: number;
  initialReconnectDelayMs?: number;
}

export function useSignalSocket({
  url = 'ws://localhost:8000/ws/signals',
  gatewayApiUrl = 'http://localhost:8000/api/v1',
  maxReconnectAttempts = 5,
  initialReconnectDelayMs = 1000,
}: UseSignalSocketOptions = {}) {
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);
  const [history, setHistory] = useState<Signal[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. WebSocket Connection Logic with Exponential Backoff
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connect
      };

      ws.onmessage = (event) => {
        try {
          const data: SocketStatePayload = JSON.parse(event.data);

          switch (data.event) {
            case 'INITIAL_STATE':
              if (data.active_signals) setActiveSignals(data.active_signals);
              if (data.history) setHistory(data.history);
              break;

            case 'SIGNAL_UPDATED':
              if (data.signal) {
                const updatedSignal = data.signal;
                
                // Remove from active list
                setActiveSignals((prev) =>
                  prev.filter((s) => s.id !== updatedSignal.id)
                );

                // Add to history
                setHistory((prev) => [
                  updatedSignal,
                  ...prev.filter((s) => s.id !== updatedSignal.id),
                ]);
              }
              break;

            case 'pong':
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('[WS] Error parsing incoming socket frame:', err);
        }
      };

      ws.onerror = () => {
        setError('WebSocket error encountered');
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;

        // Schedule auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay =
            initialReconnectDelayMs * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError(
            `Connection lost. Failed to reconnect after ${maxReconnectAttempts} attempts.`
          );
        }
      };

      socketRef.current = ws;
    } catch (err) {
      setError('Failed to instantiate WebSocket connection.');
    }
  }, [url, maxReconnectAttempts, initialReconnectDelayMs]);

  // 2. Lifecycle hook to manage connection teardown
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // 3. Heartbeat Ping Interval
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send('ping');
      }
    }, 15000);

    return () => clearInterval(pingInterval);
  }, []);

  // 4. Action Handler to dispatch trade decision to REST Gateway
  const executeDecision = useCallback(
    async (signalId: string, decision: 'APPROVED' | 'REJECTED') => {
      try {
        const response = await fetch(`${gatewayApiUrl}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signal_id: signalId,
            decision: decision,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Execution request failed.');
        }

        // Optimistic UI update while waiting for WS broadcast
        const targetSignal = activeSignals.find((s) => s.id === signalId);
        if (targetSignal) {
          const updated = { ...targetSignal, status: decision };
          setActiveSignals((prev) => prev.filter((s) => s.id !== signalId));
          setHistory((prev) => [updated, ...prev]);
        }
      } catch (err: any) {
        console.error('[Execute] Failed to dispatch decision:', err);
        setError(err.message || 'Error processing trade execution');
      }
    },
    [gatewayApiUrl, activeSignals]
  );

  return {
    activeSignals,
    history,
    isConnected,
    error,
    executeDecision,
    reconnect: connect,
  };
}
