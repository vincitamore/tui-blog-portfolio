/**
 * Mobile Command Bar
 * Floating bar with modifier keys for mobile terminal interaction.
 * Keys: Esc | Ctrl | Shift | Tab | Arrows
 *
 * NOTE: No text input field - xterm handles text input natively.
 * User taps terminal to open keyboard, types, text flows to terminal.
 * This bar just provides modifier keys that mobile keyboards lack.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './MobileCommandBar.css';

export interface MobileCommandBarProps {
  onKey: (key: string) => void;
  onEscape: () => void;
  visible: boolean;
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
  inputRef,
}) => {
  const [ctrlActive, setCtrlActive] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

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

  // Handle keyboard input from hidden input field
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;

      if (key === 'Enter') {
        e.preventDefault();
        onKey(KEYS.ENTER);
        return;
      }
      if (key === 'Backspace') {
        e.preventDefault();
        onKey('\x7f');
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
    },
    [onKey, onEscape, handleKey]
  );

  // Handle text input (forwards to terminal)
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const value = input.value;

      if (value) {
        for (const char of value) {
          handleKey(char);
        }
        input.value = '';
      }
    },
    [handleKey]
  );

  // Auto-focus the hidden input when bar becomes visible
  useEffect(() => {
    if (visible && inputRef?.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, inputRef]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className={`mobile-command-bar ${keyboardHeight > 0 ? 'keyboard-attached' : ''}`}
      style={keyboardHeight > 0 ? { bottom: `${keyboardHeight}px` } : undefined}
    >
      {/* Hidden input to capture keyboard - visually invisible but functional */}
      <input
        ref={inputRef}
        type="text"
        className="mobile-cmd-hidden-input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onKeyDown={handleInputKeyDown}
        onInput={handleInput}
        aria-label="Terminal input"
      />

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
