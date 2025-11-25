import { useEffect, useCallback } from 'react';

/**
 * Event types that can be dispatched to the XState machine.
 */
type KeyboardEvent = {
  type: 'KEY_UP' | 'KEY_DOWN' | 'KEY_LEFT' | 'KEY_RIGHT' | 'SELECT' | 'BACK' | 'TAB_NEXT' | 'TAB_PREV';
};

/**
 * Send function type from XState useMachine hook.
 */
type SendFunction = (event: KeyboardEvent) => void;

/**
 * Hook for TUI keyboard navigation.
 *
 * Supports:
 * - Arrow keys (Up/Down/Left/Right)
 * - Vim keys (h/j/k/l)
 * - Enter for selection
 * - Escape to go back
 * - Tab/Shift+Tab for focus cycling
 *
 * @param send - XState send function from useMachine hook
 */
const useKeyboard = (send: SendFunction): void => {
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      let handled = false;

      switch (e.key) {
        // Up navigation (Arrow Up or Vim k)
        case 'ArrowUp':
        case 'k':
          if (e.key === 'k' && (e.ctrlKey || e.metaKey || e.altKey)) break;
          send({ type: 'KEY_UP' });
          handled = true;
          break;

        // Down navigation (Arrow Down or Vim j)
        case 'ArrowDown':
        case 'j':
          if (e.key === 'j' && (e.ctrlKey || e.metaKey || e.altKey)) break;
          send({ type: 'KEY_DOWN' });
          handled = true;
          break;

        // Left navigation (Arrow Left or Vim h)
        case 'ArrowLeft':
        case 'h':
          if (e.key === 'h' && (e.ctrlKey || e.metaKey || e.altKey)) break;
          send({ type: 'KEY_LEFT' });
          handled = true;
          break;

        // Right navigation (Arrow Right or Vim l)
        case 'ArrowRight':
        case 'l':
          if (e.key === 'l' && (e.ctrlKey || e.metaKey || e.altKey)) break;
          send({ type: 'KEY_RIGHT' });
          handled = true;
          break;

        // Selection
        case 'Enter':
        case ' ':
          send({ type: 'SELECT' });
          handled = true;
          break;

        // Back/Cancel
        case 'Escape':
          send({ type: 'BACK' });
          handled = true;
          break;

        // Tab navigation
        case 'Tab':
          if (e.shiftKey) {
            send({ type: 'TAB_PREV' });
          } else {
            send({ type: 'TAB_NEXT' });
          }
          handled = true;
          break;

        default:
          break;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [send],
  );

  // Set up focus trap on body
  useEffect(() => {
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    return () => {
      document.body.removeAttribute('tabIndex');
      document.body.blur();
    };
  }, []);

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboard;
