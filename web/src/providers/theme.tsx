'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'theme';
const THEMES = ['light', 'dark', 'sepia'] as const;

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
  themes: string[];
  forcedTheme?: string;
  systemTheme?: string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStoredTheme(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove(...(THEMES as unknown as string[]));
  root.classList.add(theme);
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  themes = [...THEMES],
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  themes?: string[];
}) {
  const [theme, setThemeState] = useState(() => getStoredTheme(defaultTheme));

  const setTheme = useCallback(
    (value: string) => {
      setThemeState(value);
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {}
      applyTheme(value);
    },
    [],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(
    (): ThemeContextValue => ({
      theme,
      setTheme,
      resolvedTheme: theme,
      themes,
    }),
    [theme, setTheme, themes],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: 'light', setTheme: () => {}, resolvedTheme: 'light', themes: [...THEMES] };
  }
  return context;
}
