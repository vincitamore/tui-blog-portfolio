/**
 * Terminal Portfolio Application
 *
 * A terminal-style portfolio that feels like a real shell.
 * Users type commands or click on interactive elements.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Terminal, TerminalWindow } from '../shared/ui/terminal';
import type { TerminalLine } from '../shared/ui/terminal';
import { parseCommand, getWelcomeMessage } from '../shared/lib/commands';
import { initTheme, applyTheme, themes, getStoredTheme } from '../shared/lib/themes';
import { verifyAdminPassword, isAdmin, setAdminSession, logoutAdmin, changeAdminPassword } from '../shared/lib/auth';
import PortfolioApp from '../features/portfolio/ui/PortfolioApp';
import BlogApp from '../features/blog/ui/BlogApp';
import AboutApp from '../features/about/ui/AboutApp';

type AppScreen = 'terminal' | 'portfolio' | 'blog' | 'about';

let lineIdCounter = 0;
const generateLineId = () => `line-${++lineIdCounter}`;

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('terminal');
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
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  // Initialize theme on mount
  useEffect(() => {
    const theme = initTheme();
    setCurrentTheme(theme.name);
    setAdminMode(isAdmin());
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
      passwordInputRef.current.focus();
    }
  }, [showPasswordPrompt]);

  // Focus current password input when change prompt shows
  useEffect(() => {
    if (showPasswordChange && currentPasswordRef.current) {
      currentPasswordRef.current.focus();
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

  // Handle admin login
  const handleAdminLogin = useCallback(() => {
    setAdminSession(true);
    setAdminMode(true);
    addLine({ type: 'success', content: 'Logged in as admin. You now have elevated privileges.' });
  }, [addLine]);

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
              addLine({ type: 'neofetch' as any, content: result.content || '{}' });
              break;
            }
            // Check for skills (special responsive rendering)
            if (result.target === 'skills') {
              addLine({ type: 'skills' as any, content: '' });
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
              setCurrentScreen(result.target as AppScreen);
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
    [addLine, addLines, clearTerminal, adminMode, handleAdminLogin, handleAdminLogout],
  );

  // Handle back navigation from apps
  const handleBack = useCallback(() => {
    addLine({ type: 'info', content: 'Returned to terminal' });
    setCurrentScreen('terminal');
  }, [addLine]);

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

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'portfolio':
        return (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <PortfolioApp onBack={handleBack} isAdmin={adminMode} />
          </motion.div>
        );

      case 'blog':
        return (
          <motion.div
            key="blog"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <BlogApp onBack={handleBack} isAdmin={adminMode} />
          </motion.div>
        );

      case 'about':
        return (
          <motion.div
            key="about"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <AboutApp onBack={handleBack} />
          </motion.div>
        );

      default:
        return (
          <motion.div
            key="terminal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            />
          </motion.div>
        );
    }
  };

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
        style={{ height: 'calc(100dvh - 1rem)', maxHeight: 'calc(100dvh - 1rem)' }}
      >
        <AnimatePresence mode="wait">{renderScreen()}</AnimatePresence>
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
