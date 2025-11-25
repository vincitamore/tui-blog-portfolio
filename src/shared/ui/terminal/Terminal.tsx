import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'info' | 'success' | 'neofetch';
  content: string;
  timestamp?: Date;
}

// Neofetch ASCII art
const NEOFETCH_ART = `    ▄██▄ ▄██▄ ▄██▄
    ██████████████
    ▀▀▀▀ ▀▀▀▀ ▀▀▀▀
      ▄█▄    ▄█▄
    ▄█████▄▄█████▄
    ██████████████
    ▀████████████▀
      ▀████████▀
        ▀████▀
          ▀▀`;

// Responsive Neofetch component
const NeofetchOutput: React.FC<{ theme: string }> = ({ theme }) => {
  const info = [
    { label: 'vincit_amore@amore.build', value: '' },
    { label: '────────────────────────', value: '' },
    { label: 'Title', value: 'Fullstack Engineer' },
    { label: 'Motto', value: 'Qui vincit, vincit amore' },
    { label: 'OS', value: 'Terminal Portfolio v1.0' },
    { label: 'Shell', value: 'custom-zsh' },
    { label: 'Terminal', value: 'xterm-256color' },
    { label: 'Resolution', value: 'Responsive' },
    { label: 'Theme', value: theme },
    { label: 'Stack', value: 'React, TypeScript, XState' },
    { label: 'Focus', value: 'IT/OT, SCADA, Full Stack' },
  ];

  return (
    <div className="overflow-hidden my-2">
      {/* Flex container - always side by side */}
      <div className="flex flex-row items-center gap-2 sm:gap-4">
        {/* ASCII Art - scales down on mobile */}
        <div
          className="whitespace-pre font-mono text-[8px] sm:text-[10px] md:text-xs leading-tight shrink-0"
          style={{ color: 'var(--term-primary)' }}
        >
          {NEOFETCH_ART}
        </div>
        {/* Info section */}
        <div className="text-xs sm:text-sm space-y-0.5">
          {info.map((item, i) => (
            <div key={i}>
              {item.value ? (
                <>
                  <span style={{ color: 'var(--term-primary)' }}>{item.label}:</span>
                  <span style={{ color: 'var(--term-foreground)' }}> {item.value}</span>
                </>
              ) : (
                <span style={{ color: i === 0 ? 'var(--term-accent)' : 'var(--term-muted)' }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface TerminalProps {
  lines: TerminalLine[];
  prompt?: string;
  username?: string;
  onCommand: (command: string) => void;
  isProcessing?: boolean;
  welcomeMessage?: React.ReactNode;
}

/**
 * Terminal shell component with command input and blinking cursor.
 * Designed to feel like a real modern terminal.
 */
const Terminal: React.FC<TerminalProps> = ({
  lines,
  prompt = '~',
  username = 'visitor',
  onCommand,
  isProcessing = false,
  welcomeMessage,
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom and maintain focus
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    // Always keep input focused when lines change
    inputRef.current?.focus();
  }, [lines]);

  // Focus input on mount and when window regains focus
  useEffect(() => {
    inputRef.current?.focus();

    // Refocus when window regains focus
    const handleWindowFocus = () => {
      inputRef.current?.focus();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  // Focus input on click anywhere in terminal
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Handle command submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isProcessing) return;

      const cmd = input.trim();
      setCommandHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      setInput('');
      onCommand(cmd);
      
      // Ensure focus is maintained after command
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
    [input, isProcessing, onCommand],
  );

  // Re-focus when processing completes
  useEffect(() => {
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex =
            historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setInput('');
          } else {
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // TODO: Add tab completion
      }
    },
    [commandHistory, historyIndex],
  );

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-[var(--term-primary)]';
      case 'error':
        return 'text-[var(--term-error)]';
      case 'success':
        return 'text-[var(--term-success)]';
      case 'info':
        return 'text-[var(--term-info)]';
      default:
        return 'text-[var(--term-foreground)]';
    }
  };

  return (
    <div
      ref={terminalRef}
      onClick={handleTerminalClick}
      className="h-full overflow-auto font-mono text-sm leading-tight cursor-text p-4"
      style={{ backgroundColor: 'var(--term-background)', color: 'var(--term-foreground)' }}
    >
      {/* Welcome message - no background, no overflow */}
      {welcomeMessage && <div className="mb-2 overflow-hidden">{welcomeMessage}</div>}

      {/* Terminal output */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={line.type === 'neofetch' ? '' : `whitespace-pre-wrap break-words ${getLineColor(line.type)}`}
            >
              {line.type === 'command' && (
                <span className="text-[var(--term-muted)]">
                  <span className="text-[var(--term-accent)]">{username}</span>
                  <span className="text-[var(--term-foreground)]">@</span>
                  <span className="text-[var(--term-secondary)]">amore.build</span>
                  <span className="text-[var(--term-muted)]">:</span>
                  <span className="text-[var(--term-info)]">{prompt}</span>
                  <span className="text-[var(--term-foreground)]">$ </span>
                </span>
              )}
              {line.type === 'neofetch' ? (
                <NeofetchOutput theme={(() => {
                  try {
                    return JSON.parse(line.content).theme;
                  } catch {
                    return 'dracula';
                  }
                })()} />
              ) : (
                line.content
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Command input line */}
      <form onSubmit={handleSubmit} className="mt-1 flex items-center">
        <span className="text-[var(--term-muted)] shrink-0">
          <span className="text-[var(--term-accent)]">{username}</span>
          <span className="text-[var(--term-foreground)]">@</span>
          <span className="text-[var(--term-secondary)]">amore.build</span>
          <span className="text-[var(--term-muted)]">:</span>
          <span className="text-[var(--term-info)]">{prompt}</span>
          <span className="text-[var(--term-foreground)]">$ </span>
        </span>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent outline-none caret-transparent"
            style={{ color: 'var(--term-foreground)' }}
          />
          {/* Blinking cursor */}
          <span
            className="absolute top-0 pointer-events-none"
            style={{ left: `${input.length}ch` }}
          >
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block w-[0.6em] h-[1.2em] -mb-[0.2em]"
              style={{ backgroundColor: 'var(--term-primary)' }}
            />
          </span>
        </div>
      </form>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mt-2 flex items-center gap-2 text-[var(--term-muted)]">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Processing...
          </motion.span>
        </div>
      )}
    </div>
  );
};

export default Terminal;

