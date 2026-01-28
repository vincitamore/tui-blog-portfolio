import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCommandSuggestions } from '../../lib/commands';

export interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'info' | 'success' | 'neofetch' | 'skills' | 'contact';
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

// Skills data for the table - category must be exactly 12 chars, skills exactly 47 chars
const SKILLS_DATA = [
  { category: 'Network     ', skills: 'Fiber (CFOT), SCADA, Wireless, IT/OT            ' },
  { category: 'Linux/DevOps', skills: 'Ubuntu/Debian/RHEL, Docker, Nginx, CI/CD, Bash  ' },
  { category: 'Sys Admin   ', skills: 'AD, Azure AD, Windows Server, VMware, PowerShell' },
  { category: 'Security    ', skills: 'EDR/XDR, Security Onion, OT/ICS Security, SIEM  ' },
  { category: 'AI          ', skills: 'Claude, Grok, Gemini, Ollama, RAG Systems       ' },
  { category: 'Development ', skills: 'TypeScript, React, Next.js, Python, Node.js     ' },
  { category: 'Databases   ', skills: 'PostgreSQL, SQL Server, TimescaleDB, ChromaDB   ' },
  { category: 'Industrial  ', skills: 'PLC Programming, Control Systems, VMware HA     ' },
];

// Responsive Skills table component - slightly smaller than experience timeline
const SkillsOutput: React.FC = () => {
  return (
    <div className="overflow-hidden my-2">
      <div
        className="text-[9px] xs:text-[10px] sm:text-[12px] md:text-[13px] lg:text-sm leading-tight whitespace-pre font-mono"
        style={{ width: 'fit-content' }}
      >
        {/* Table header */}
        <div style={{ color: 'var(--term-muted)' }}>┌──────────────┬─────────────────────────────────────────────────┐</div>
        <div>
          <span style={{ color: 'var(--term-muted)' }}>│ </span>
          <span style={{ color: 'var(--term-accent)' }}>CATEGORY    </span>
          <span style={{ color: 'var(--term-muted)' }}> │ </span>
          <span style={{ color: 'var(--term-accent)' }}>SKILLS                                          </span>
          <span style={{ color: 'var(--term-muted)' }}>│</span>
        </div>
        <div style={{ color: 'var(--term-muted)' }}>├──────────────┼─────────────────────────────────────────────────┤</div>
        
        {/* Table rows */}
        {SKILLS_DATA.map((row, i) => (
          <div key={i}>
            <span style={{ color: 'var(--term-muted)' }}>│ </span>
            <span style={{ color: 'var(--term-primary)' }}>{row.category}</span>
            <span style={{ color: 'var(--term-muted)' }}> │ </span>
            <span style={{ color: 'var(--term-foreground)' }}>{row.skills}</span>
            <span style={{ color: 'var(--term-muted)' }}>│</span>
          </div>
        ))}
        
        {/* Table footer */}
        <div style={{ color: 'var(--term-muted)' }}>└──────────────┴─────────────────────────────────────────────────┘</div>
      </div>
    </div>
  );
};

// Contact data with clickable links
const CONTACT_DATA = [
  { label: 'Email', value: 'vincit_amore@amore.build', href: 'mailto:vincit_amore@amore.build' },
  { label: 'GitHub', value: 'github.com/vincitamore', href: 'https://github.com/vincitamore' },
  { label: 'X', value: '@vincit_amore', href: 'https://x.com/vincit_amore' },
  { label: 'Website', value: 'amore.build', href: 'https://amore.build' },
];

// Contact output component with clickable links
const ContactOutput: React.FC = () => {
  return (
    <div className="my-2">
      <div className="mb-2" style={{ color: 'var(--term-foreground)' }}>
        Contact Information:
      </div>
      <div className="space-y-1 pl-2">
        {CONTACT_DATA.map((contact) => (
          <div key={contact.label} className="flex items-center gap-4">
            <span
              className="w-16 sm:w-20"
              style={{ color: 'var(--term-muted)' }}
            >
              {contact.label}
            </span>
            <a
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted hover:decoration-solid touch-manipulation py-1"
              style={{ color: 'var(--term-primary)' }}
            >
              {contact.value}
            </a>
          </div>
        ))}
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
  autoTypeCommand?: string;
  onAutoTypeComplete?: () => void;
  disableFocus?: boolean; // Disable auto-focus when modals are open
  isAdmin?: boolean; // For tab completion of admin commands
}

// Known commands for making them clickable in output
const CLICKABLE_COMMANDS = [
  'help', 'ls', 'dir', 'cd', 'portfolio', 'blog', 'about',
  'theme', 'whoami', 'clear', 'cls', 'neofetch', 'contact', 'skills', 'cat',
  // Admin commands
  'visitors', 'passwd', 'logout'
];

// Theme names that should be clickable (will run "theme <name>")
const CLICKABLE_THEMES = [
  'matrix', 'dracula', 'monokai', 'nord', 'tokyonight', 'gruvbox', 'synthwave',
  'catppuccin', 'solarized', 'onedark', 'nightowl', 'rosepine', 'everforest',
  'kanagawa', 'palenight', 'horizon', 'cobalt', 'ayu', 'amber', 'github', 'vscode', 'oceanicnext'
];

// Parse a line and make commands/themes clickable
const renderClickableOutput = (
  content: string,
  onCommandClick: (cmd: string) => void
): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) parts.push('\n');
    
    let foundMatch = false;
    
    // Check for commands in help listing format: "  command  " or "  cmd, cmd2  " or "  cmd <arg>  "
    // Must start with 2 spaces, then command, then either comma, space+special char, or 2+ spaces
    for (const cmd of CLICKABLE_COMMANDS) {
      // Match: 2 spaces, command, then (comma OR 2+ spaces OR space+[ OR space+<)
      const regex = new RegExp(`^(  )(${cmd})(,| {2,}| \\[| <)`, 'i');
      const match = line.match(regex);
      if (match) {
        const beforeCmd = match[1];
        const cmdText = match[2];
        const afterCmd = match[3];
        const rest = line.slice(match[0].length);
        
        parts.push(beforeCmd);
        parts.push(
          <button
            key={`${lineIdx}-${cmd}`}
            onClick={(e) => {
              e.stopPropagation();
              onCommandClick(cmdText.toLowerCase());
            }}
            className="underline decoration-dotted hover:decoration-solid cursor-pointer touch-manipulation"
            style={{ color: 'var(--term-accent)' }}
          >
            {cmdText}
          </button>
        );
        parts.push(afterCmd);
        parts.push(rest);
        foundMatch = true;
        break;
      }
    }
    
    // Check for theme names - ONLY lowercase exact matches (excludes "GitHub" but matches "github")
    if (!foundMatch) {
      for (const themeName of CLICKABLE_THEMES) {
        // Must be exactly lowercase, with 2 leading spaces and 2+ trailing spaces
        const regex = new RegExp(`^(  )(${themeName})(\\s{2,})(.*)$`);
        const match = line.match(regex);
        if (match && match[2] === themeName) { // Ensure exact case match
          const beforeTheme = match[1];
          const themeText = match[2];
          const spacing = match[3];
          const label = match[4];
          
          parts.push(beforeTheme);
          parts.push(
            <button
              key={`${lineIdx}-theme-${themeName}`}
              onClick={(e) => {
                e.stopPropagation();
                onCommandClick(`theme ${themeText}`);
              }}
              className="underline decoration-dotted hover:decoration-solid cursor-pointer touch-manipulation"
              style={{ color: 'var(--term-accent)' }}
            >
              {themeText}
            </button>
          );
          parts.push(spacing);
          parts.push(label);
          foundMatch = true;
          break;
        }
      }
    }
    
    if (!foundMatch) {
      parts.push(line);
    }
  });
  
  return <>{parts}</>;
};

// Check if device is likely mobile/touch (to avoid keyboard popup on link clicks)
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

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
  autoTypeCommand,
  onAutoTypeComplete,
  disableFocus = false,
  isAdmin = false,
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Focus input only on non-touch devices to avoid keyboard popup
  // Skip if focus is disabled (e.g., when a modal is open)
  const focusInput = useCallback(() => {
    if (!isTouchDevice() && !disableFocus) {
      inputRef.current?.focus();
    }
  }, [disableFocus]);

  // Auto-type effect
  useEffect(() => {
    if (!autoTypeCommand) return;

    let currentIndex = 0;
    let isActive = true;
    
    const typeNextChar = () => {
      if (!isActive) return;
      
      if (currentIndex < autoTypeCommand.length) {
        currentIndex++;
        setInput(autoTypeCommand.slice(0, currentIndex));
        setTimeout(typeNextChar, 80);
      } else {
        // Done typing, pause then execute
        setTimeout(() => {
          if (!isActive) return;
          onCommand(autoTypeCommand);
          setInput('');
          setCommandHistory((prev) => [...prev, autoTypeCommand]);
          onAutoTypeComplete?.();
        }, 300);
      }
    };
    
    // Start typing
    typeNextChar();

    return () => {
      isActive = false;
    };
  }, [autoTypeCommand, onCommand, onAutoTypeComplete]);

  // Auto-scroll to bottom and maintain focus (desktop only)
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    // Focus input when lines change - but not on touch devices (avoids keyboard popup)
    focusInput();
  }, [lines, focusInput]);

  // Focus input on mount and when window regains focus (desktop only)
  useEffect(() => {
    focusInput();

    // Refocus when window regains focus (desktop only)
    const handleWindowFocus = () => {
      focusInput();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [focusInput]);

  // Focus input on click anywhere in terminal (desktop only - touch users tap input directly)
  const handleTerminalClick = useCallback(() => {
    focusInput();
  }, [focusInput]);

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

  // Re-focus when processing completes (desktop only)
  useEffect(() => {
    if (!isProcessing) {
      focusInput();
    }
  }, [isProcessing, focusInput]);

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
        // Tab completion
        const trimmed = input.trim();
        if (!trimmed) return;

        // Only complete the first word (command)
        const parts = trimmed.split(/\s+/);
        const partial = parts[0].toLowerCase();

        const suggestions = getCommandSuggestions(partial, isAdmin);

        if (suggestions.length === 1) {
          // Exact match - complete the command
          if (parts.length > 1) {
            // Keep the rest of the input
            setInput(suggestions[0] + ' ' + parts.slice(1).join(' '));
          } else {
            setInput(suggestions[0] + ' ');
          }
        } else if (suggestions.length > 1) {
          // Multiple matches - find common prefix
          const commonPrefix = suggestions.reduce((prefix, suggestion) => {
            while (!suggestion.startsWith(prefix)) {
              prefix = prefix.slice(0, -1);
            }
            return prefix;
          }, suggestions[0]);

          if (commonPrefix.length > partial.length) {
            // Complete to common prefix
            if (parts.length > 1) {
              setInput(commonPrefix + ' ' + parts.slice(1).join(' '));
            } else {
              setInput(commonPrefix);
            }
          }
          // Show suggestions (could add visual feedback here in the future)
        }
      }
    },
    [commandHistory, historyIndex, input, isAdmin],
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
              className={line.type === 'neofetch' || line.type === 'skills' ? '' : `whitespace-pre-wrap break-words ${getLineColor(line.type)}`}
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
              ) : line.type === 'skills' ? (
                <SkillsOutput />
              ) : line.type === 'contact' ? (
                <ContactOutput />
              ) : line.type === 'output' ? (
                renderClickableOutput(line.content, onCommand)
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

