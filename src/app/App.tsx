/**
 * Terminal Portfolio Application
 *
 * A terminal-style portfolio that feels like a real shell.
 * Users type commands or click on interactive elements.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Terminal, TerminalWindow } from '../shared/ui/terminal';
import type { TerminalLine } from '../shared/ui/terminal';
import { parseCommand, getWelcomeMessage } from '../shared/lib/commands';
import { initTheme, applyTheme, themes, getStoredTheme } from '../shared/lib/themes';
import { verifyAdminPassword, setAdminSession, logoutAdmin, changeAdminPassword, getAuthToken, restoreSession } from '../shared/lib/auth';
import { fetchAdminComments, banIp, unbanIp, deleteComment } from '../shared/lib/api';
import PortfolioApp from '../features/portfolio/ui/PortfolioApp';
import BlogApp from '../features/blog/ui/BlogApp';
import AboutApp from '../features/about/ui/AboutApp';

type AppScreen = 'terminal' | 'portfolio' | 'blog' | 'about';

// Map URL paths to screen names
const pathToScreen = (pathname: string): AppScreen => {
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname.startsWith('/about')) return 'about';
  return 'terminal';
};

// Map screen names to URL paths
const screenToPath = (screen: AppScreen): string => {
  switch (screen) {
    case 'portfolio': return '/portfolio';
    case 'blog': return '/blog';
    case 'about': return '/about';
    default: return '/';
  }
};

let lineIdCounter = 0;
const generateLineId = () => `line-${++lineIdCounter}`;

// Detect in-app browsers (Twitter, Facebook, Instagram, etc.) that have bottom navigation bars
const detectInAppBrowser = (): { isInApp: boolean; extraPadding: number } => {
  if (typeof window === 'undefined') return { isInApp: false, extraPadding: 0 };
  
  const ua = navigator.userAgent.toLowerCase();
  
  // Twitter in-app browser
  if (ua.includes('twitter') || ua.includes('x.com')) {
    return { isInApp: true, extraPadding: 120 }; // Twitter has ~120px bottom bar
  }
  
  // Facebook in-app browser
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('facebook')) {
    return { isInApp: true, extraPadding: 100 };
  }
  
  // Instagram in-app browser
  if (ua.includes('instagram')) {
    return { isInApp: true, extraPadding: 100 };
  }
  
  // LinkedIn in-app browser
  if (ua.includes('linkedin')) {
    return { isInApp: true, extraPadding: 80 };
  }
  
  return { isInApp: false, extraPadding: 0 };
};

// Format time ago string
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentScreen = useMemo(() => pathToScreen(location.pathname), [location.pathname]);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentTheme, setCurrentTheme] = useState('dracula');
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [autoTypeCommand, setAutoTypeCommand] = useState<string | undefined>(undefined);
  const [hasAutoTyped, setHasAutoTyped] = useState(false);
  const [inAppPadding, setInAppPadding] = useState(0);
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  // Initialize theme on mount and detect in-app browser
  useEffect(() => {
    const theme = initTheme();
    setCurrentTheme(theme.name);
    
    // Detect in-app browsers and set extra padding
    const { extraPadding } = detectInAppBrowser();
    setInAppPadding(extraPadding);
    
    // Log visit (fire and forget)
    fetch('/api/visit', { method: 'POST' }).catch(() => {});
    
    // Try to restore admin session from localStorage
    restoreSession().then((restored) => {
      setAdminMode(restored);
    });
  }, []);

  // Auto-type help command on first load (after a brief delay)
  useEffect(() => {
    if (hasAutoTyped) return;
    
    // Small delay to let the terminal render first
    const timer = setTimeout(() => {
      setHasAutoTyped(true);
      setAutoTypeCommand('help');
    }, 800);
    
    return () => clearTimeout(timer);
  }, [hasAutoTyped]);

  // Clear auto-type command after completion
  const handleAutoTypeComplete = useCallback(() => {
    setAutoTypeCommand(undefined);
  }, []);

  // Focus password input when prompt shows
  useEffect(() => {
    if (showPasswordPrompt && passwordInputRef.current) {
      // Small delay to ensure terminal focus is disabled first
      requestAnimationFrame(() => {
        passwordInputRef.current?.focus();
      });
    }
  }, [showPasswordPrompt]);

  // Focus current password input when change prompt shows
  useEffect(() => {
    if (showPasswordChange && currentPasswordRef.current) {
      // Small delay to ensure terminal focus is disabled first
      requestAnimationFrame(() => {
        currentPasswordRef.current?.focus();
      });
    }
  }, [showPasswordChange]);

  // Add a line to the terminal
  const addLine = useCallback((line: Omit<TerminalLine, 'id'>) => {
    setLines((prev) => [...prev, { ...line, id: generateLineId() }]);
  }, []);

  // Add multiple lines
  const addLines = useCallback((newLines: string[], type: TerminalLine['type'] = 'output') => {
    setLines((prev) => [
      ...prev,
      ...newLines.map((content) => ({ id: generateLineId(), type, content })),
    ]);
  }, []);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    setLines([]);
  }, []);

  // Fetch and display admin dashboard
  const showDashboard = useCallback(async () => {
    try {
      const data = await fetchAdminComments();
      const lines = [
        '',
        '╔════════════════════════════════════════════════════════════════╗',
        '║                      ADMIN DASHBOARD                          ║',
        '╠════════════════════════════════════════════════════════════════╣',
        `║  Total Comments:        ${String(data.totalComments).padEnd(38)}║`,
        `║  New Since Last Login:  ${String(data.newSinceLastLogin).padEnd(38)}║`,
        `║  Posts With Comments:   ${String(Object.keys(data.commentsByPost).length).padEnd(38)}║`,
        '╠════════════════════════════════════════════════════════════════╣',
        '║  Recent Comments:                                              ║',
      ];

      if (data.comments.length === 0) {
        lines.push('║    No comments yet.                                            ║');
      } else {
        data.comments.slice(0, 5).forEach(c => {
          const preview = c.content.slice(0, 40).replace(/\n/g, ' ');
          const truncated = preview.length < c.content.length ? preview + '...' : preview;
          lines.push(`║    • ${c.author.slice(0, 12).padEnd(12)} on ${c.postSlug.slice(0, 15).padEnd(15)} ║`);
          lines.push(`║      "${truncated.padEnd(42)}" ║`);
        });
      }

      lines.push('╠════════════════════════════════════════════════════════════════╣');
      lines.push('║  Commands: dashboard | comments | ban | unban | delete-comment ║');
      lines.push('╚════════════════════════════════════════════════════════════════╝');
      lines.push('');

      addLines(lines, 'output');
    } catch (err) {
      addLine({ type: 'error', content: 'Failed to load dashboard' });
    }
  }, [addLine, addLines]);

  // Handle admin login
  const handleAdminLogin = useCallback(() => {
    setAdminSession(true);
    setAdminMode(true);
    addLine({ type: 'success', content: 'Logged in as admin. You now have elevated privileges.' });
    // Show dashboard on login
    showDashboard();
  }, [addLine, showDashboard]);

  // Handle admin logout
  const handleAdminLogout = useCallback(() => {
    logoutAdmin();
    setAdminMode(false);
    addLine({ type: 'info', content: 'Logged out from admin session' });
  }, [addLine]);

  // Handle password submission
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    const valid = await verifyAdminPassword(passwordInput);
    if (valid) {
      setShowPasswordPrompt(false);
      setPasswordInput('');
      handleAdminLogin();
    } else {
      setPasswordError('Access denied');
      setPasswordInput('');
    }
  }, [passwordInput, handleAdminLogin]);

  // Handle password change submission
  const handlePasswordChangeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess(false);
    
    // Validate inputs
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      setPasswordChangeError('All fields are required');
      return;
    }
    
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('New passwords do not match');
      return;
    }
    
    if (newPasswordInput.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters');
      return;
    }
    
    const result = await changeAdminPassword(currentPasswordInput, newPasswordInput);
    if (result.success) {
      setPasswordChangeSuccess(true);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      // Close after short delay
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordChangeSuccess(false);
        addLine({ type: 'success', content: 'Password changed successfully' });
      }, 1500);
    } else {
      setPasswordChangeError(result.error || 'Failed to change password');
    }
  }, [currentPasswordInput, newPasswordInput, confirmPasswordInput, addLine]);

  // Handle command execution
  const handleCommand = useCallback(
    async (command: string) => {
      // Add the command to history
      addLine({ type: 'command', content: command });

      setIsProcessing(true);

      // Small delay for effect
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Pass context to command parser
      const results = parseCommand(command, {
        currentTheme: getStoredTheme(),
        isAdmin: adminMode,
        onAdminLogin: handleAdminLogin,
        onAdminLogout: handleAdminLogout,
      });

      for (const result of results) {
        switch (result.type) {
          case 'output':
            // Check for admin login trigger
            if (result.target === 'admin_login') {
              setShowPasswordPrompt(true);
              break;
            }
            // Check for password change trigger
            if (result.target === 'password_change') {
              setShowPasswordChange(true);
              break;
            }
            // Check for neofetch (special responsive rendering)
            if (result.target === 'neofetch') {
              addLine({ type: 'neofetch', content: result.content || '{}' });
              break;
            }
            // Check for skills (special responsive rendering)
            if (result.target === 'skills') {
              addLine({ type: 'skills', content: '' });
              break;
            }
            // Check for contact (special clickable rendering)
            if (result.target === 'contact') {
              addLine({ type: 'contact', content: '' });
              break;
            }
            // Check for whoami (fetch IP and display)
            if (result.target === 'whoami') {
              const role = result.content || 'visitor';
              // Fetch IP asynchronously
              fetch('/api/whoami')
                .then(res => res.json())
                .then(data => {
                  const ip = data.ip || 'unknown';
                  addLine({ 
                    type: 'output', 
                    content: `${role}${role === 'admin' ? ' (elevated)' : ''}\nIP: ${ip}` 
                  });
                })
                .catch(() => {
                  addLine({ type: 'output', content: `${role}${role === 'admin' ? ' (elevated)' : ''}` });
                });
              break;
            }
            // Check for visitors (admin only - fetch visitor logs)
            if (result.target === 'visitors') {
              const token = getAuthToken();
              fetch('/api/visitors', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
              })
                .then(res => {
                  if (!res.ok) throw new Error('Unauthorized');
                  return res.json();
                })
                .then((logs: Array<{ ip: string; timestamp: string; userAgent: string }>) => {
                  if (logs.length === 0) {
                    addLine({ type: 'output', content: 'No visitor logs yet.' });
                    return;
                  }
                  // Format the logs nicely
                  const lines = [
                    '',
                    `Recent visitors (${logs.length} entries):`,
                    '',
                  ];
                  logs.slice(0, 20).forEach((log, i) => {
                    const date = new Date(log.timestamp);
                    const timeAgo = getTimeAgo(date);
                    const ua = log.userAgent.length > 50 
                      ? log.userAgent.slice(0, 50) + '...' 
                      : log.userAgent;
                    lines.push(`  ${String(i + 1).padStart(2)}. ${log.ip.padEnd(16)} ${timeAgo.padEnd(14)} ${ua}`);
                  });
                  if (logs.length > 20) {
                    lines.push(`  ... and ${logs.length - 20} more`);
                  }
                  lines.push('');
                  addLines(lines, 'output');
                })
                .catch(() => {
                  addLine({ type: 'error', content: 'Failed to fetch visitor logs' });
                });
              break;
            }
            // Dashboard command
            if (result.target === 'dashboard') {
              showDashboard();
              break;
            }
            // Comments list command
            if (result.target === 'comments') {
              fetchAdminComments()
                .then(data => {
                  if (data.comments.length === 0) {
                    addLine({ type: 'output', content: 'No comments yet.' });
                    return;
                  }
                  const lines = [
                    '',
                    `Recent comments (${data.comments.length} total):`,
                    '',
                  ];
                  data.comments.slice(0, 20).forEach((c, i) => {
                    const date = new Date(c.createdAt);
                    const timeAgo = getTimeAgo(date);
                    const isNew = new Date(c.createdAt).getTime() > new Date(data.lastLogin).getTime();
                    const newBadge = isNew ? ' [NEW]' : '';
                    lines.push(`  ${String(i + 1).padStart(2)}. ${c.author.padEnd(15)} ${timeAgo.padEnd(12)} ${c.postSlug}${newBadge}`);
                    lines.push(`      ID: ${c.id}  IP: ${c.ip}`);
                    const preview = c.content.slice(0, 60).replace(/\n/g, ' ');
                    lines.push(`      "${preview}${c.content.length > 60 ? '...' : ''}"`);
                    lines.push('');
                  });
                  if (data.comments.length > 20) {
                    lines.push(`  ... and ${data.comments.length - 20} more`);
                    lines.push('');
                  }
                  lines.push('  Use: delete-comment <post-slug> <comment-id>');
                  lines.push('  Use: ban <ip> [reason]');
                  lines.push('');
                  addLines(lines, 'output');
                })
                .catch(() => {
                  addLine({ type: 'error', content: 'Failed to fetch comments' });
                });
              break;
            }
            // Ban IP command
            if (result.target === 'ban_ip') {
              try {
                const { ip, reason } = JSON.parse(result.content || '{}');
                banIp(ip, reason)
                  .then(() => {
                    addLine({ type: 'success', content: `Banned IP: ${ip}` });
                  })
                  .catch((err) => {
                    addLine({ type: 'error', content: err.message || 'Failed to ban IP' });
                  });
              } catch {
                addLine({ type: 'error', content: 'Invalid ban command' });
              }
              break;
            }
            // Unban IP command
            if (result.target === 'unban_ip') {
              const ip = result.content;
              unbanIp(ip || '')
                .then(() => {
                  addLine({ type: 'success', content: `Unbanned IP: ${ip}` });
                })
                .catch((err) => {
                  addLine({ type: 'error', content: err.message || 'Failed to unban IP' });
                });
              break;
            }
            // Delete comment command
            if (result.target === 'delete_comment') {
              try {
                const { postSlug, commentId } = JSON.parse(result.content || '{}');
                deleteComment(postSlug, commentId)
                  .then(() => {
                    addLine({ type: 'success', content: `Deleted comment ${commentId} from ${postSlug}` });
                  })
                  .catch((err) => {
                    addLine({ type: 'error', content: err.message || 'Failed to delete comment' });
                  });
              } catch {
                addLine({ type: 'error', content: 'Invalid delete command' });
              }
              break;
            }
            if (result.lines) {
              addLines(result.lines, 'output');
            } else if (result.content) {
              addLine({ type: 'output', content: result.content });
            }
            break;

          case 'error':
            addLine({ type: 'error', content: result.content || 'Unknown error' });
            break;

          case 'success':
            addLine({ type: 'success', content: result.content || '' });
          break;

          case 'info':
            addLine({ type: 'info', content: result.content || '' });
          break;

          case 'navigate':
            if (result.target) {
              // Add a small delay before navigation for effect
              await new Promise((resolve) => setTimeout(resolve, 300));
              navigate(screenToPath(result.target as AppScreen));
            }
          break;

          case 'clear':
            clearTerminal();
          break;

          case 'theme':
            if (result.target && themes[result.target]) {
              applyTheme(result.target);
              setCurrentTheme(result.target);
              addLine({ type: 'success', content: result.content || `Theme: ${result.target}` });
            }
          break;
      }
      }

      setIsProcessing(false);
    },
    [addLine, addLines, clearTerminal, adminMode, handleAdminLogin, handleAdminLogout, showDashboard],
  );

  // Handle back navigation from apps
  const handleBack = useCallback(() => {
    addLine({ type: 'info', content: 'Returned to terminal' });
    navigate('/');
  }, [addLine, navigate]);

  // Welcome message component - ASCII art stays small, text below is larger on mobile
  const welcomeBanner = getWelcomeMessage();
  const WelcomeMessage = (
    <div className="flex flex-col items-center overflow-hidden">
      {/* ASCII Art Header - stays small on mobile, tight line height */}
      <div
        className="whitespace-pre font-mono text-[5px] sm:text-[8px] md:text-[10px] lg:text-xs"
        style={{ 
          color: 'var(--term-primary)',
          background: 'transparent',
          lineHeight: 1,
        }}
      >
        {welcomeBanner.header}
      </div>
      {/* Footer text - larger on mobile for readability */}
      <div
        className="leading-none whitespace-pre font-mono text-[9px] sm:text-[9px] md:text-[10px] lg:text-xs"
        style={{ 
          color: 'var(--term-primary)',
          background: 'transparent',
        }}
      >
        {welcomeBanner.footer}
      </div>
    </div>
  );

  // Password prompt modal
  const PasswordPrompt = showPasswordPrompt && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 max-w-sm w-full mx-4"
        style={{
          backgroundColor: 'var(--term-background)',
          border: '1px solid var(--term-border)',
        }}
      >
        <div className="text-center mb-4">
          <div style={{ color: 'var(--term-primary)' }} className="text-lg font-bold mb-1">
            sudo admin
          </div>
          <div style={{ color: 'var(--term-muted)' }} className="text-sm">
            Enter admin password
          </div>
        </div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: 'var(--term-muted)' }}>[sudo]</span>
            <input
              ref={passwordInputRef}
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="flex-1 bg-transparent outline-none font-mono"
              style={{
                color: 'var(--term-foreground)',
                borderBottom: '1px solid var(--term-border)',
              }}
              placeholder="password"
              autoComplete="off"
            />
          </div>
          {passwordError && (
            <div className="text-sm mb-4" style={{ color: 'var(--term-error)' }}>
              {passwordError}
            </div>
          )}
          <div className="flex gap-2 justify-end text-sm">
            <button
              type="button"
                  onClick={() => {
                setShowPasswordPrompt(false);
                setPasswordInput('');
                setPasswordError('');
              }}
              className="px-3 py-1"
              style={{
                color: 'var(--term-muted)',
                border: '1px solid var(--term-border)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1"
              style={{
                color: 'var(--term-background)',
                backgroundColor: 'var(--term-primary)',
                  }}
                >
              Login
            </button>
                </div>
        </form>
      </motion.div>
    </motion.div>
  );

  // Password change modal
  const PasswordChangeModal = showPasswordChange && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-4 sm:p-6 max-w-sm w-full mx-4"
        style={{
          backgroundColor: 'var(--term-background)',
          border: '1px solid var(--term-border)',
        }}
      >
        <div className="text-center mb-4">
          <div style={{ color: 'var(--term-primary)' }} className="text-lg font-bold mb-1">
            passwd
            </div>
          <div style={{ color: 'var(--term-muted)' }} className="text-sm">
            Change admin password
            </div>
        </div>
        
        {passwordChangeSuccess ? (
          <div className="text-center py-4" style={{ color: 'var(--term-success)' }}>
            Password changed successfully!
            </div>
        ) : (
          <form onSubmit={handlePasswordChangeSubmit}>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--term-muted)' }}>
                  Current Password
                </label>
                <input
                  ref={currentPasswordRef}
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="w-full p-2 bg-transparent outline-none font-mono text-sm"
                  style={{
                    color: 'var(--term-foreground)',
                    border: '1px solid var(--term-border)',
                    fontSize: '16px',
                  }}
                  placeholder="Current password"
                  autoComplete="off"
                />
            </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--term-muted)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full p-2 bg-transparent outline-none font-mono text-sm"
                  style={{
                    color: 'var(--term-foreground)',
                    border: '1px solid var(--term-border)',
                    fontSize: '16px',
                  }}
                  placeholder="New password (min 6 chars)"
                  autoComplete="off"
                />
        </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--term-muted)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full p-2 bg-transparent outline-none font-mono text-sm"
                  style={{
                    color: 'var(--term-foreground)',
                    border: '1px solid var(--term-border)',
                    fontSize: '16px',
                  }}
                  placeholder="Confirm new password"
                  autoComplete="off"
                />
            </div>
            </div>
            
            {passwordChangeError && (
              <div className="text-sm mb-4" style={{ color: 'var(--term-error)' }}>
                {passwordChangeError}
        </div>
            )}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false);
                  setCurrentPasswordInput('');
                  setNewPasswordInput('');
                  setConfirmPasswordInput('');
                  setPasswordChangeError('');
                }}
                className="flex-1 px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                style={{
                  color: 'var(--term-muted)',
                  border: '1px solid var(--term-border)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                style={{
                  color: 'var(--term-background)',
                  backgroundColor: 'var(--term-primary)',
                }}
              >
                Change Password
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );

  // Terminal component for the home route
  const TerminalScreen = (
    <motion.div
      key="terminal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, pointerEvents: 'auto' as const }}
      exit={{ opacity: 0, pointerEvents: 'none' as const }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Terminal
        lines={lines}
        prompt="~"
        username={adminMode ? 'admin' : 'visitor'}
        onCommand={handleCommand}
        isProcessing={isProcessing}
        welcomeMessage={WelcomeMessage}
        autoTypeCommand={autoTypeCommand}
        onAutoTypeComplete={handleAutoTypeComplete}
        disableFocus={showPasswordPrompt || showPasswordChange}
        isAdmin={adminMode}
      />
    </motion.div>
  );

  // Animated wrapper for sub-apps
  // Use currentScreen as key so sub-route changes (e.g., /portfolio -> /portfolio/slug)
  // don't cause remounts within the same section
  const AnimatedApp = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      key={currentScreen}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1, pointerEvents: 'auto' as const }}
      exit={{ opacity: 0, scale: 0.98, pointerEvents: 'none' as const }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );

  return (
    <div
      className="h-dvh w-screen p-2 sm:p-4 md:p-8 lg:p-12 flex items-center justify-center overflow-hidden fixed inset-0"
      style={{
        background: `
          radial-gradient(ellipse at top, color-mix(in srgb, var(--term-primary) 8%, var(--term-background)) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, color-mix(in srgb, var(--term-secondary) 5%, var(--term-background)) 0%, transparent 40%),
          var(--term-background)
        `,
      }}
    >
      {/* Ambient glow behind terminal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--term-primary) 3%, transparent) 0%, transparent 50%)`,
        }}
      />

      <TerminalWindow
        title={`${adminMode ? 'admin' : 'visitor'}@amore.build:~/${currentScreen === 'terminal' ? '' : currentScreen}`}
        className="w-full max-w-6xl relative z-10"
        style={{
          height: `calc(100dvh - 1rem - ${inAppPadding}px)`,
          maxHeight: `calc(100dvh - 1rem - ${inAppPadding}px)`
        }}
      >
        <AnimatePresence mode="popLayout">
          <Routes location={location} key={currentScreen}>
            <Route path="/" element={TerminalScreen} />
            <Route path="/portfolio/*" element={
              <AnimatedApp>
                <PortfolioApp onBack={handleBack} isAdmin={adminMode} />
              </AnimatedApp>
            } />
            <Route path="/blog/*" element={
              <AnimatedApp>
                <BlogApp onBack={handleBack} isAdmin={adminMode} />
              </AnimatedApp>
            } />
            <Route path="/about" element={
              <AnimatedApp>
                <AboutApp onBack={handleBack} />
              </AnimatedApp>
            } />
            {/* Fallback to terminal for unknown routes */}
            <Route path="*" element={TerminalScreen} />
          </Routes>
        </AnimatePresence>
        <AnimatePresence>{PasswordPrompt}</AnimatePresence>
        <AnimatePresence>{PasswordChangeModal}</AnimatePresence>
      </TerminalWindow>

      {/* Status indicators */}
      <div className="fixed bottom-4 right-4 flex gap-2 text-xs z-20">
        {adminMode && (
          <div
            className="px-2 py-1 rounded"
            style={{ 
              color: 'var(--term-success)', 
              backgroundColor: 'var(--term-selection)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            ADMIN
          </div>
        )}
        <div
          className="px-2 py-1 rounded"
          style={{ 
            color: 'var(--term-muted)', 
            backgroundColor: 'var(--term-selection)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          theme: {currentTheme}
        </div>
      </div>
    </div>
  );
};

export default App;
