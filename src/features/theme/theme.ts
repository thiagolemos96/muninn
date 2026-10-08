import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

// Same key the inline script in index.html reads before the first paint
const STORAGE_KEY = 'muninn-theme';
const darkQuery = '(prefers-color-scheme: dark)';

function readSaved(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function saveTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the theme still applies until the tab closes
  }
}

// The <html data-theme> attribute is the single source of truth.
// Without a saved choice, follow the system when it changes.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });

  const media = matchMedia(darkQuery);
  const onSystemChange = () => {
    if (!readSaved()) document.documentElement.dataset.theme = media.matches ? 'dark' : 'light';
  };
  media.addEventListener('change', onSystemChange);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', onSystemChange);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  const toggle = useCallback(() => saveTheme(theme === 'dark' ? 'light' : 'dark'), [theme]);
  return { theme, toggle };
}
