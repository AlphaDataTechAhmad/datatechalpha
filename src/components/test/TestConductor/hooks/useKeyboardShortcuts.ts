import { useCallback, useEffect } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutMap {
  [key: string]: {
    handler: ShortcutHandler;
    description: string;
    preventDefault?: boolean;
  };
}

export const useKeyboardShortcuts = (shortcuts: ShortcutMap, enabled: boolean = true) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Build the key combination string (e.g., "Control+Shift+ArrowRight")
      const keys: string[] = [];

      if (e.ctrlKey) keys.push('Control');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      if (e.metaKey) keys.push('Meta');

      // Add the main key, handling special keys
      if (e.key.length === 1) {
        // Single character key (a-z, 0-9, etc.)
        keys.push(e.key.toUpperCase());
      } else {
        // Special key (ArrowLeft, Enter, etc.)
        keys.push(e.key);
      }

      const keyCombination = keys.join('+');
      const shortcut = shortcuts[keyCombination];

      if (shortcut) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.handler(e);
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Helper function to format shortcut for display
  const formatShortcut = (key: string): string => {
    return key
      .split('+')
      .map((k) => {
        switch (k) {
          case 'Control':
            return 'Ctrl';
          case ' ':
            return 'Space';
          case 'ArrowUp':
            return '↑';
          case 'ArrowDown':
            return '↓';
          case 'ArrowLeft':
            return '←';
          case 'ArrowRight':
            return '→';
          default:
            return k;
        }
      })
      .join(' + ');
  };

  // Get all registered shortcuts for display in help
  const getShortcutsList = () => {
    return Object.entries(shortcuts).map(([key, { description }]) => ({
      keys: formatShortcut(key),
      description,
    }));
  };

  return {
    formatShortcut,
    getShortcutsList,
  };
};

export default useKeyboardShortcuts;
