import React from 'react';

interface TuiStatusBarProps {
  /** Current screen/path to display */
  currentScreen: string;
  /** Optional custom help text */
  helpText?: string;
}

/**
 * Dynamic status bar component showing current location and keyboard hints.
 * Positioned at the bottom of the screen with terminal-style aesthetics.
 */
const TuiStatusBar: React.FC<TuiStatusBarProps> = ({
  currentScreen,
  helpText = '↑↓ nav | Enter select | Esc back',
}) => (
  <div
    role="status"
    aria-live="polite"
    className="fixed bottom-0 left-0 right-0 px-4 py-2 text-xs bg-terminal-black/90 border-t border-ansi-green/50 flex justify-between items-center font-mono"
  >
    <span className="text-ansi-green/80">
      <span className="text-ansi-green">❯</span> {currentScreen}
    </span>
    <span className="text-ansi-green/60">{helpText}</span>
  </div>
);

export default TuiStatusBar;
