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

  // Touch scrolling state
  const touchStartY = useRef<number | null>(null);
  const touchScrolling = useRef(false);
  const lastScrollTime = useRef(0);

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

  // Detect mobile and handle visual viewport for keyboard
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Visual viewport API for mobile keyboard handling
    const viewport = window.visualViewport;
    if (viewport) {
      const handleViewportResize = () => {
        // When keyboard opens, viewport height shrinks
        const wrapper = document.querySelector('.ssh-terminal-wrapper') as HTMLElement;
        if (wrapper) {
          const keyboardHeight = window.innerHeight - viewport.height;
          if (keyboardHeight > 100) {
            // Keyboard is likely open - adjust padding
            wrapper.style.paddingBottom = `${60 + keyboardHeight}px`;
            wrapper.classList.add('keyboard-open');
          } else {
            // Keyboard closed
            wrapper.style.paddingBottom = '';
            wrapper.classList.remove('keyboard-open');
          }
          // Trigger xterm fit
          fitAddonRef.current?.fit();
        }
      };

      viewport.addEventListener('resize', handleViewportResize);
      viewport.addEventListener('scroll', handleViewportResize);

      return () => {
        window.removeEventListener('resize', checkMobile);
        viewport.removeEventListener('resize', handleViewportResize);
        viewport.removeEventListener('scroll', handleViewportResize);
      };
    }

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

    // Get theme colors from CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const getVar = (name: string, fallback: string) =>
      computedStyle.getPropertyValue(name).trim() || fallback;

    // Create terminal with theme from CSS variables
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      // Disable screen reader mode which can cause input issues on mobile
      screenReaderMode: false,
      theme: {
        background: getVar('--term-background', '#1a1a2e'),
        foreground: getVar('--term-foreground', '#e0e0e0'),
        cursor: getVar('--term-primary', '#e0e0e0'),
        cursorAccent: getVar('--term-background', '#1a1a2e'),
        selectionBackground: getVar('--term-selection', '#6366f1'),
        black: getVar('--term-background', '#000000'),
        red: getVar('--term-error', '#ff5555'),
        green: getVar('--term-success', '#50fa7b'),
        yellow: getVar('--term-warning', '#f1fa8c'),
        blue: getVar('--term-primary', '#bd93f9'),
        magenta: getVar('--term-secondary', '#ff79c6'),
        cyan: getVar('--term-info', '#8be9fd'),
        white: getVar('--term-foreground', '#f8f8f2'),
        brightBlack: getVar('--term-muted', '#6272a4'),
        brightRed: getVar('--term-error', '#ff6e6e'),
        brightGreen: getVar('--term-accent', '#69ff94'),
        brightYellow: getVar('--term-warning', '#ffffa5'),
        brightBlue: getVar('--term-primary', '#d6acff'),
        brightMagenta: getVar('--term-secondary', '#ff92df'),
        brightCyan: getVar('--term-info', '#a4ffff'),
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

    // Configure the helper textarea to reduce mobile IME interference
    // Note: Don't change position/size - xterm needs to position it at cursor
    const textarea = terminalRef.current.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.setAttribute('autocomplete', 'off');
      textarea.setAttribute('autocorrect', 'off');
      textarea.setAttribute('autocapitalize', 'off');
      textarea.setAttribute('spellcheck', 'false');
    }

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

  // Prevent pull-to-refresh on mobile by disabling it on body when terminal is active
  useEffect(() => {
    // Add overscroll-behavior to body when terminal mounts
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  // Touch scroll handlers for smooth mobile scrolling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchScrolling.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || e.touches.length !== 1) return;

    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    const now = Date.now();

    // Only process if enough time has passed (throttle)
    if (now - lastScrollTime.current < 16) return; // ~60fps
    lastScrollTime.current = now;

    // If we've moved more than a small threshold, we're scrolling
    if (Math.abs(deltaY) > 5) {
      touchScrolling.current = true;

      // Scroll the terminal
      if (xtermRef.current) {
        // Calculate lines to scroll based on delta
        // Adjust sensitivity - smaller divisor = faster scrolling
        const linesToScroll = Math.round(deltaY / 20);
        if (linesToScroll !== 0) {
          xtermRef.current.scrollLines(linesToScroll);
          touchStartY.current = currentY; // Reset for continuous scrolling
        }
      }

      // Prevent default to stop browser scrolling
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    // Small delay before allowing click to prevent accidental taps after scroll
    setTimeout(() => {
      touchScrolling.current = false;
    }, 100);
  }, []);

  // Modified click handler to ignore clicks during/after scroll
  const handleContainerClick = useCallback(() => {
    if (!touchScrolling.current) {
      xtermRef.current?.focus();
    }
  }, []);

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
