import { useTheme } from 'next-themes';
import type { EditorTheme } from '~types/story';

export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  shadow: string;
};

export const themeColors: Record<EditorTheme, ThemeColors> = {
  light: {
    background: 'oklch(0.874 0.034 263.561)',
    foreground: '#131e23',
    card: '#e9f0f4',
    cardForeground: '#282a2b',
    primary: '#012a4a',
    primaryForeground: '#bacada',
    secondary: '#28454a',
    secondaryForeground: '#81f0ff',
    accent: '#115078',
    accentForeground: '#88d1f8',
    muted: '#98b5bc',
    mutedForeground: '#505e61',
    destructive: '#602a2a',
    destructiveForeground: '#f89e9e',
    border: '#ffffff',
    input: 'red',
    ring: 'red',
    shadow: 'oklch(0.717 0.041 257.926 / 0.55)',
  },
  dark: {
    background: 'oklch(0.145 0 0)',
    foreground: 'oklch(0.985 0 0)',
    card: 'oklch(0.205 0 0)',
    cardForeground: 'oklch(0.985 0 0)',
    primary: 'oklch(0.922 0 0)',
    primaryForeground: 'oklch(0.205 0 0)',
    secondary: 'oklch(0.269 0 0)',
    secondaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.269 0 0)',
    accentForeground: 'oklch(0.985 0 0)',
    muted: 'oklch(0.269 0 0)',
    mutedForeground: 'oklch(0.708 0 0)',
    destructive: 'oklch(0.704 0.191 22.216)',
    destructiveForeground: 'red',
    border: 'oklch(1 0 0 / 10%)',
    input: 'oklch(1 0 0 / 15%)',
    ring: 'oklch(0.556 0 0)',
    shadow: 'oklch(0.717 0.041 257.926 / 0.55)',
  },
  sepia: {
    background: 'oklch(0.96 0.04 85)',
    foreground: 'oklch(0.27 0.05 50)',
    card: 'oklch(0.96 0.04 85)',
    cardForeground: 'oklch(0.27 0.05 50)',
    primary: 'oklch(0.35 0.06 50)',
    primaryForeground: 'oklch(0.96 0.04 85)',
    secondary: 'oklch(0.9 0.05 80)',
    secondaryForeground: 'oklch(0.27 0.05 50)',
    accent: 'oklch(0.9 0.05 80)',
    accentForeground: 'oklch(0.27 0.05 50)',
    muted: 'oklch(0.9 0.05 80)',
    mutedForeground: 'oklch(0.5 0.05 60)',
    destructive: 'oklch(0.577 0.245 27.325)',
    destructiveForeground: 'red',
    border: 'oklch(0.85 0.05 75)',
    input: 'oklch(0.85 0.05 75)',
    ring: 'oklch(0.6 0.05 60)',
    shadow: 'oklch(0.717 0.041 257.926 / 0.55)',
  },
};

const isEditorTheme = (value: string | undefined): value is EditorTheme =>
  value === 'light' || value === 'dark' || value === 'sepia';

export const useColors = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const activeTheme = isEditorTheme(theme)
    ? theme
    : isEditorTheme(resolvedTheme)
      ? resolvedTheme
      : 'light';

  return {
    theme: activeTheme,
    setTheme,
    themeColors: themeColors,
    colors: themeColors[activeTheme],
  };
};
