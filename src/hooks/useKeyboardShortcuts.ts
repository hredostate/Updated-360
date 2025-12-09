import { useEffect, useCallback, useRef } from 'react';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Command key on Mac
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'general';
  sequence?: string[]; // For sequential shortcuts like "G then D"
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (
  shortcuts: Shortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options;
  const sequenceRef = useRef<string[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout>();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow Escape key to work in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Check for sequential shortcuts (like "g then d")
      if (!ctrl && !shift && !alt && key.length === 1) {
        sequenceRef.current.push(key);
        
        // Clear the sequence after 1 second of inactivity
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
        sequenceTimeoutRef.current = setTimeout(() => {
          sequenceRef.current = [];
        }, 1000);

        // Check if any sequential shortcut matches
        for (const shortcut of shortcuts) {
          if (shortcut.sequence) {
            const sequenceStr = sequenceRef.current.join('');
            const targetSequence = shortcut.sequence.join('');
            
            if (sequenceStr === targetSequence) {
              if (preventDefault) event.preventDefault();
              shortcut.action();
              sequenceRef.current = [];
              return;
            }
          }
        }
      }

      // Check for regular shortcuts
      for (const shortcut of shortcuts) {
        if (shortcut.sequence) continue; // Skip sequential shortcuts

        const keyMatches = shortcut.key.toLowerCase() === key;
        const ctrlMatches = (shortcut.ctrl || shortcut.meta) ? ctrl : !ctrl;
        const shiftMatches = shortcut.shift ? shift : !shift;
        const altMatches = shortcut.alt ? alt : !alt;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          if (preventDefault) event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled, preventDefault]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
      };
    }
  }, [enabled, handleKeyDown]);

  return { shortcuts };
};

/**
 * Get platform-specific modifier key name
 */
export const getModifierKey = (): string => {
  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  return isMac ? '⌘' : 'Ctrl';
};

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut: Shortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.sequence) {
    return shortcut.sequence.map(k => k.toUpperCase()).join(' then ');
  }
  
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(getModifierKey());
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push('Alt');
  }
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
};

/**
 * Default keyboard shortcuts for the application
 */
export const defaultShortcuts = (handlers: {
  onSearch?: () => void;
  onCommandPalette?: () => void;
  onShowHelp?: () => void;
  onSave?: () => void;
  onNew?: () => void;
  onGoToDashboard?: () => void;
  onGoToStudents?: () => void;
  onGoToReports?: () => void;
  onGoToTasks?: () => void;
  onGoToAnalytics?: () => void;
  onEscape?: () => void;
}): Shortcut[] => [
  // General shortcuts
  {
    key: 'k',
    ctrl: true,
    description: 'Open command palette / quick search',
    action: handlers.onCommandPalette || (() => {}),
    category: 'general',
  },
  {
    key: '/',
    ctrl: true,
    description: 'Show keyboard shortcuts help',
    action: handlers.onShowHelp || (() => {}),
    category: 'general',
  },
  {
    key: 'f',
    ctrl: true,
    description: 'Focus search input',
    action: handlers.onSearch || (() => {}),
    category: 'general',
  },
  {
    key: 'escape',
    description: 'Close modals/panels',
    action: handlers.onEscape || (() => {}),
    category: 'general',
  },
  
  // Action shortcuts
  {
    key: 'n',
    ctrl: true,
    description: 'Create new (context-aware)',
    action: handlers.onNew || (() => {}),
    category: 'actions',
  },
  {
    key: 's',
    ctrl: true,
    description: 'Save current form',
    action: handlers.onSave || (() => {}),
    category: 'actions',
  },
  
  // Navigation shortcuts
  {
    key: 'd',
    sequence: ['g', 'd'],
    description: 'Go to Dashboard',
    action: handlers.onGoToDashboard || (() => {}),
    category: 'navigation',
  },
  {
    key: 's',
    sequence: ['g', 's'],
    description: 'Go to Students',
    action: handlers.onGoToStudents || (() => {}),
    category: 'navigation',
  },
  {
    key: 'r',
    sequence: ['g', 'r'],
    description: 'Go to Reports',
    action: handlers.onGoToReports || (() => {}),
    category: 'navigation',
  },
  {
    key: 't',
    sequence: ['g', 't'],
    description: 'Go to Tasks',
    action: handlers.onGoToTasks || (() => {}),
    category: 'navigation',
  },
  {
    key: 'a',
    sequence: ['g', 'a'],
    description: 'Go to Analytics',
    action: handlers.onGoToAnalytics || (() => {}),
    category: 'navigation',
  },
];
