/**
 * SSH Terminal Component
 * Full xterm.js terminal for SSH sessions
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useSSHConnection, ConnectionStatus } from './useSSHConnection';
import { MobileCommandBar } from './MobileCommandBar';
import './SSHTerminal.css';

export interface SSHTerminalProps {
  wsUrl: string;
  token: string;
  onDisconnect: () => void;
  onError?: (message: string) => void;
}

export const SSHTerminal: React.FC<SSHTerminalProps> = ({
  wsUrl,
  token,
  onDisconnect,
  onError,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showCommandBar, setShowCommandBar] = useState(false);

  // SSH connection hook
  const {
    status,
    connect,
    disconnect,
    sendInput,
    resize,
    errorMessage,
  } = useSSHConnection({
    wsUrl,
    token,
    onOutput: useCallback((data: Uint8Array) => {
      if (xtermRef.current) {
        xtermRef.current.write(data);
      }
    }, []),
    onStatusChange: useCallback((newStatus: ConnectionStatus) => {
      console.log('[SSHTerminal] Status:', newStatus);
    }, []),
    onError: useCallback((message: string) => {
      console.error('[SSHTerminal] Error:', message);
      onError?.(message);
    }, [onError]),
    onDisconnect: useCallback((message: string) => {
      console.log('[SSHTerminal] Disconnected:', message);
      onDisconnect();
    }, [onDisconnect]),
  });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show command bar when connected on mobile
  useEffect(() => {
    setShowCommandBar(isMobile && status === 'connected');
  }, [isMobile, status]);

  // Store latest callbacks in refs to avoid dependency issues
  const sendInputRef = useRef(sendInput);
  const resizeRef = useRef(resize);
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);

  useEffect(() => {
    sendInputRef.current = sendInput;
    resizeRef.current = resize;
    connectRef.current = connect;
    disconnectRef.current = disconnect;
  }, [sendInput, resize, connect, disconnect]);

  // Initialize xterm.js - runs once on mount
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      theme: {
        background: '#1a1a2e',
        foreground: '#e0e0e0',
        cursor: '#e0e0e0',
        cursorAccent: '#1a1a2e',
        selectionBackground: '#6366f1',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
      },
      scrollback: 10000,
      allowProposedApi: true,
    });

    // Add fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    // Add web links addon
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(webLinksAddon);

    // Open terminal in container
    term.open(terminalRef.current);
    xtermRef.current = term;

    // Fit to container
    fitAddon.fit();

    // Handle terminal input
    term.onData((data) => {
      sendInputRef.current(data);
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (term.cols && term.rows) {
        resizeRef.current(term.cols, term.rows);
      }
    };

    // ResizeObserver for container changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(terminalRef.current);

    // Also listen for window resize
    window.addEventListener('resize', handleResize);

    // Connect to SSH
    connectRef.current();

    // Send initial size after connection
    setTimeout(() => {
      if (term.cols && term.rows) {
        resizeRef.current(term.cols, term.rows);
      }
    }, 500);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      disconnectRef.current();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []); // Empty deps - run once on mount

  // Handle keyboard focus
  const handleContainerClick = useCallback(() => {
    xtermRef.current?.focus();
  }, []);

  // Mobile command bar key handler
  const handleMobileKey = useCallback((key: string) => {
    sendInput(key);
    xtermRef.current?.focus();
  }, [sendInput]);

  // Mobile escape handler
  const handleMobileEscape = useCallback(() => {
    // Send escape to terminal
    sendInput('\x1b');
    xtermRef.current?.focus();
  }, [sendInput]);

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'authenticating':
        return 'Authenticating...';
      case 'connected':
        return 'Connected';
      case 'error':
        return errorMessage || 'Error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="ssh-terminal-wrapper">
      {/* Status bar */}
      <div className={`ssh-terminal-status ssh-status-${status}`}>
        <span className="ssh-status-indicator" />
        <span className="ssh-status-text">{getStatusText()}</span>
        {status === 'connected' && (
          <button
            className="ssh-disconnect-btn"
            onClick={onDisconnect}
            aria-label="Disconnect"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Terminal container */}
      <div
        ref={terminalRef}
        className="ssh-terminal-container"
        onClick={handleContainerClick}
      />

      {/* Mobile command bar */}
      <MobileCommandBar
        visible={showCommandBar}
        onKey={handleMobileKey}
        onEscape={handleMobileEscape}
      />
    </div>
  );
};
