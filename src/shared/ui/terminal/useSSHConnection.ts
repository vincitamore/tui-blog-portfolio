/**
 * WebSocket hook for SSH proxy connection
 * Handles connection lifecycle, reconnection, and message handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Message types matching ssh-ws-proxy protocol
interface ClientMessage {
  type: 'auth' | 'input' | 'resize' | 'ping';
  token?: string;
  data?: string;
  cols?: number;
  rows?: number;
}

interface ServerMessage {
  type: 'auth_ok' | 'auth_fail' | 'output' | 'error' | 'disconnect' | 'pong';
  data?: string;
  message?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'authenticating' | 'connected' | 'error';

export interface UseSSHConnectionOptions {
  wsUrl: string;
  token: string;
  onOutput: (data: Uint8Array) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (message: string) => void;
  onDisconnect?: (message: string) => void;
}

export interface UseSSHConnectionResult {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  errorMessage: string | null;
}

const PING_INTERVAL = 30000; // 30 seconds
// const RECONNECT_DELAY = 3000; // 3 seconds (reserved for future reconnection logic)

export function useSSHConnection(options: UseSSHConnectionOptions): UseSSHConnectionResult {
  const { wsUrl, token, onOutput, onStatusChange, onError, onDisconnect } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update status and notify
  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Clear timers
  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Send message helper
  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    clearTimers();
    setErrorMessage(null);

    updateStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[SSH] WebSocket connected, authenticating...');
        updateStatus('authenticating');
        send({ type: 'auth', token });

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          send({ type: 'ping' });
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'auth_ok':
              console.log('[SSH] Authenticated');
              updateStatus('connected');
              break;

            case 'auth_fail':
              console.error('[SSH] Authentication failed:', msg.message);
              setErrorMessage(msg.message || 'Authentication failed');
              updateStatus('error');
              onError?.(msg.message || 'Authentication failed');
              ws.close();
              break;

            case 'output':
              if (msg.data) {
                // Decode base64 output
                const bytes = Uint8Array.from(atob(msg.data), (c) => c.charCodeAt(0));
                onOutput(bytes);
              }
              break;

            case 'error':
              console.error('[SSH] Error:', msg.message);
              setErrorMessage(msg.message || 'Unknown error');
              onError?.(msg.message || 'Unknown error');
              break;

            case 'disconnect':
              console.log('[SSH] Disconnected:', msg.message);
              onDisconnect?.(msg.message || 'Connection closed');
              updateStatus('disconnected');
              break;

            case 'pong':
              // Keepalive response, ignore
              break;
          }
        } catch (e) {
          console.error('[SSH] Failed to parse message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('[SSH] WebSocket error:', event);
        setErrorMessage('Connection error');
        updateStatus('error');
      };

      ws.onclose = () => {
        console.log('[SSH] WebSocket closed');
        clearTimers();
        wsRef.current = null;

        // Only update to disconnected if not already in error state
        if (status !== 'error') {
          updateStatus('disconnected');
        }
      };
    } catch (e) {
      console.error('[SSH] Failed to connect:', e);
      setErrorMessage('Failed to connect');
      updateStatus('error');
    }
  }, [wsUrl, token, onOutput, onError, onDisconnect, updateStatus, clearTimers, send, status]);

  // Disconnect
  const disconnect = useCallback(() => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    updateStatus('disconnected');
  }, [clearTimers, updateStatus]);

  // Send terminal input (base64 encoded)
  const sendInput = useCallback(
    (data: string) => {
      if (status !== 'connected') return;
      // Encode as base64
      const base64 = btoa(data);
      send({ type: 'input', data: base64 });
    },
    [status, send]
  );

  // Resize terminal
  const resize = useCallback(
    (cols: number, rows: number) => {
      if (status !== 'connected') return;
      send({ type: 'resize', cols, rows });
    },
    [status, send]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearTimers]);

  return {
    status,
    connect,
    disconnect,
    sendInput,
    resize,
    errorMessage,
  };
}
