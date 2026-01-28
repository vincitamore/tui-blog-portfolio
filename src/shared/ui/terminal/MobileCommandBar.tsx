/**
 * Mobile Command Bar
 * Floating bar with modifier keys for mobile terminal interaction
 * Keys: Esc | Ctrl | Shift | Tab | Arrows
 */

import React, { useState, useCallback } from 'react';
import './MobileCommandBar.css';

export interface MobileCommandBarProps {
  onKey: (key: string) => void;
  onEscape: () => void;
  visible: boolean;
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
}) => {
  const [ctrlActive, setCtrlActive] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);

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

  if (!visible) return null;

  return (
    <div className="mobile-command-bar">
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
