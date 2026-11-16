export type Theme = 'dark' | 'light';

/**
 * Jiayou V8.1: Single official dark theme permanently enforced on every device.
 * Guarantees identical dark palette across Windows, macOS, Android, iOS regardless
 * of OS prefers-color-scheme setting.
 */
export function initializeTheme(): Theme {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
  return 'dark';
}

export function useTheme() {
  return {
    theme: 'dark' as Theme,
    setTheme: (_next: Theme) => {
      /* Locked to single official dark theme in V8.1 */
    },
    toggleTheme: () => {
      /* Locked to single official dark theme in V8.1 */
    },
  };
}
