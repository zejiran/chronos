import { createSignal, createEffect, onCleanup } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export type ThemeName = 'midnight' | 'dawn' | 'abyss' | 'arctic' | 'neon' | 'latte';
export type ThemeMode = 'light' | 'dark' | 'system';
export type Density = 'compact' | 'comfortable' | 'spacious';

export interface ThemeSettings {
  theme: ThemeName;
  mode: ThemeMode;
  density: Density;
  highContrast: boolean;
  reducedMotion: boolean;
}

const DEFAULT_THEME: ThemeSettings = {
  theme: 'midnight',
  mode: 'dark',
  density: 'comfortable',
  highContrast: false,
  reducedMotion: false,
};

const THEME_STORAGE_KEY = 'chronos-theme';

// Theme signal for reactive updates
const [themeSettings, setThemeSettings] = createSignal<ThemeSettings>(loadThemeFromStorage());

// Load theme from localStorage
function loadThemeFromStorage(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_THEME, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load theme from storage:', e);
  }
  return DEFAULT_THEME;
}

// Save theme to localStorage
function saveThemeToStorage(settings: ThemeSettings): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save theme to storage:', e);
  }
}

// Apply theme to document
function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;

  // Set theme attribute
  root.setAttribute('data-theme', settings.theme);

  // Determine actual mode (resolve 'system')
  let actualMode = settings.mode;
  if (settings.mode === 'system') {
    actualMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-mode', actualMode);

  // Set density
  root.setAttribute('data-density', settings.density);

  // Set high contrast
  if (settings.highContrast) {
    root.setAttribute('data-contrast', 'high');
  } else {
    root.removeAttribute('data-contrast');
  }

  // Set reduced motion
  if (settings.reducedMotion) {
    root.setAttribute('data-reduced-motion', 'true');
  } else {
    root.removeAttribute('data-reduced-motion');
  }
}

// Initialize theme system
export function initTheme(): void {
  // Apply initial theme
  applyTheme(themeSettings());

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    if (themeSettings().mode === 'system') {
      applyTheme(themeSettings());
    }
  };
  mediaQuery.addEventListener('change', handleSystemThemeChange);

  // Listen for reduced motion preference
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleMotionChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      updateTheme({ reducedMotion: true });
    }
  };
  motionQuery.addEventListener('change', handleMotionChange);
}

// Update theme settings
export function updateTheme(updates: Partial<ThemeSettings>): void {
  const newSettings = { ...themeSettings(), ...updates };
  setThemeSettings(newSettings);
  saveThemeToStorage(newSettings);
  applyTheme(newSettings);

  // Notify backend about theme change
  try {
    invoke('update_settings', {
      settings: {
        theme: newSettings.theme,
        density: newSettings.density,
      },
    }).catch(() => {
      // Silently fail if backend isn't ready
    });
  } catch {
    // Ignore errors during initialization
  }
}

// Set specific theme
export function setTheme(theme: ThemeName): void {
  updateTheme({ theme });
}

// Set theme mode
export function setThemeMode(mode: ThemeMode): void {
  updateTheme({ mode });
}

// Set density
export function setDensity(density: Density): void {
  updateTheme({ density });
}

// Toggle high contrast
export function toggleHighContrast(): void {
  updateTheme({ highContrast: !themeSettings().highContrast });
}

// Toggle reduced motion
export function toggleReducedMotion(): void {
  updateTheme({ reducedMotion: !themeSettings().reducedMotion });
}

// Get current theme settings
export function getThemeSettings(): ThemeSettings {
  return themeSettings();
}

// Use theme hook for components
export function useTheme() {
  return {
    settings: themeSettings,
    setTheme,
    setThemeMode,
    setDensity,
    toggleHighContrast,
    toggleReducedMotion,
    updateTheme,
  };
}

// Theme watcher for hot reload from config file
export function useThemeHotReload() {
  let unlisten: UnlistenFn | undefined;

  createEffect(() => {
    // Listen for theme changes from backend
    listen<ThemeSettings>('theme-changed', (event) => {
      const newTheme = event.payload;
      setThemeSettings(prev => ({ ...prev, ...newTheme }));
      applyTheme(themeSettings());
    }).then(fn => {
      unlisten = fn;
    });
  });

  onCleanup(() => {
    unlisten?.();
  });
}

// CSS variable getter for dynamic styling
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--colors-${name}`).trim();
}

// Theme color palette
export const THEME_PALETTES: Record<ThemeName, { name: string; preview: string[] }> = {
  midnight: {
    name: 'Midnight',
    preview: ['#1e1e2e', '#89b4fa', '#f38ba8', '#a6e3a1'],
  },
  dawn: {
    name: 'Dawn',
    preview: ['#fafafa', '#5b8def', '#e85d75', '#4ade80'],
  },
  abyss: {
    name: 'Abyss',
    preview: ['#000000', '#60a5fa', '#fb7185', '#4ade80'],
  },
  arctic: {
    name: 'Arctic',
    preview: ['#2e3440', '#88c0d0', '#bf616a', '#a3be8c'],
  },
  neon: {
    name: 'Neon',
    preview: ['#1a1b26', '#7aa2f7', '#bb9af7', '#9ece6a'],
  },
  latte: {
    name: 'Latte',
    preview: ['#eff1f5', '#1e66f5', '#d20f39', '#40a02b'],
  },
};
