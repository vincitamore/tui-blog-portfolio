/**
 * Mobile Command Bar
 * Floating bar with text input and modifier keys for mobile terminal interaction.
 *
 * KEY INSIGHT: Don't rely on xterm's hidden textarea - it doesn't work well on mobile.
 * Instead, we use our own visible input that captures keystrokes and forwards them
 * to the terminal. xterm becomes display-only on mobile.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './MobileCommandBar.css';

export interface MobileCommandBarProps {
  onKey: (key: string) => void;
  onEscape: () => void;
  visible: boolean;
  /** Ref to focus the input from parent */
  inputRef?: React.RefObject<HTMLInputElement>;
}

// Special key codes
const KEYS = {
  ESC: '\x1b',
  TAB: '\t',
  UP: '\x1b[A',
  DOWN: '\x1b[B',
  LEFT: '\x1b[D',
  RIGHT: '\x1b[C',
  ENTER: '\r',
};

export const MobileCommandBar: React.FC<MobileCommandBarProps> = ({
  onKey,
  onEscape,
  visible,
  inputRef: externalInputRef,
}) => {
  const [ctrlActive, setCtrlActive] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  // Track keyboard via visual viewport API
  useEffect(() => {
    if (!visible) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // Calculate keyboard height from viewport difference
      const keyboardH = window.innerHeight - viewport.height;
      setKeyboardHeight(keyboardH > 50 ? keyboardH : 0);
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    // Initial check
    handleResize();

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, [visible]);

  // Handle modifier key press
  const handleCtrl = useCallback(() => {
    setCtrlActive((prev) => !prev);
    setShiftActive(false);
  }, []);

  const handleShift = useCallback(() => {
    setShiftActive((prev) => !prev);
    setCtrlActive(false);
  }, []);

  // Handle special key press
  const handleKey = useCallback(
    (key: string) => {
      if (ctrlActive) {
        // Ctrl+key: send control character (key.charCodeAt(0) - 64 for A-Z)
        if (key.length === 1 && key >= 'a' && key <= 'z') {
          const ctrlChar = String.fromCharCode(key.toUpperCase().charCodeAt(0) - 64);
          onKey(ctrlChar);
        } else {
          onKey(key);
        }
        setCtrlActive(false);
      } else if (shiftActive) {
        // Shift: uppercase for letters
        onKey(key.toUpperCase());
        setShiftActive(false);
      } else {
        onKey(key);
      }
    },
    [ctrlActive, shiftActive, onKey]
  );

  // Handle Esc separately
  const handleEsc = useCallback(() => {
    // Clear modifiers
    setCtrlActive(false);
    setShiftActive(false);
    // Trigger escape handler
    onEscape();
  }, [onEscape]);

  // Handle text input - capture keystrokes and send to terminal
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent default for most keys - we handle them ourselves
      const key = e.key;

      // Handle special keys
      if (key === 'Enter') {
        e.preventDefault();
        onKey(KEYS.ENTER);
        return;
      }
      if (key === 'Backspace') {
        e.preventDefault();
        onKey('\x7f'); // DEL character for backspace
        return;
      }
      if (key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }
      if (key === 'Tab') {
        e.preventDefault();
        handleKey(KEYS.TAB);
        return;
      }
      if (key === 'ArrowUp') {
        e.preventDefault();
        handleKey(KEYS.UP);
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault();
        handleKey(KEYS.DOWN);
        return;
      }
      if (key === 'ArrowLeft') {
        e.preventDefault();
        handleKey(KEYS.LEFT);
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        handleKey(KEYS.RIGHT);
        return;
      }

      // For printable characters, let the input event handle it
      // (this allows IME composition to work)
    },
    [onKey, onEscape, handleKey]
  );

  // Handle actual text input (works with IME)
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const value = input.value;

      if (value) {
        // Send each character
        for (const char of value) {
          handleKey(char);
        }
        // Clear the input
        input.value = '';
      }
    },
    [handleKey]
  );

  // Focus the input when command bar becomes visible
  useEffect(() => {
    if (visible && inputRef.current) {
      // Small delay to ensure keyboard has time to open
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, inputRef]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className={`mobile-command-bar ${keyboardHeight > 0 ? 'keyboard-attached' : ''}`}
      style={keyboardHeight > 0 ? { transform: `translateY(-${keyboardHeight}px)` } : undefined}
    >
      {/* Text input row - this captures all keyboard input */}
      <div className="mobile-command-bar-input-row">
        <input
          ref={inputRef}
          type="text"
          className="mobile-cmd-input"
          placeholder="Type here..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onKeyDown={handleInputKeyDown}
          onInput={handleInput}
          aria-label="Terminal input"
        />
      </div>

      <div className="mobile-command-bar-row">
        {/* Escape */}
        <button
          className="mobile-cmd-btn mobile-cmd-esc"
          onClick={handleEsc}
          aria-label="Escape"
        >
          Esc
        </button>

        {/* Modifiers */}
        <button
          className={`mobile-cmd-btn mobile-cmd-mod ${ctrlActive ? 'active' : ''}`}
          onClick={handleCtrl}
          aria-label="Control modifier"
          aria-pressed={ctrlActive}
        >
          Ctrl
        </button>
        <button
          className={`mobile-cmd-btn mobile-cmd-mod ${shiftActive ? 'active' : ''}`}
          onClick={handleShift}
          aria-label="Shift modifier"
          aria-pressed={shiftActive}
        >
          Shift
        </button>

        {/* Tab */}
        <button
          className="mobile-cmd-btn"
          onClick={() => handleKey(KEYS.TAB)}
          aria-label="Tab"
        >
          Tab
        </button>

        {/* Spacer */}
        <div className="mobile-cmd-spacer" />

        {/* Arrows */}
        <button
          className="mobile-cmd-btn mobile-cmd-arrow"
          onClick={() => handleKey(KEYS.UP)}
          aria-label="Up arrow"
        >
          ↑
        </button>
        <button
          className="mobile-cmd-btn mobile-cmd-arrow"
          onClick={() => handleKey(KEYS.DOWN)}
          aria-label="Down arrow"
        >
          ↓
        </button>
        <button
          className="mobile-cmd-btn mobile-cmd-arrow"
          onClick={() => handleKey(KEYS.LEFT)}
          aria-label="Left arrow"
        >
          ←
        </button>
        <button
          className="mobile-cmd-btn mobile-cmd-arrow"
          onClick={() => handleKey(KEYS.RIGHT)}
          aria-label="Right arrow"
        >
          →
        </button>
      </div>
    </div>
  );
};
