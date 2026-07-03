import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'nba-theme-mode';
const ThemeContext = createContext(null);

const getPreferredTheme = () => {
  return 'dark';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    const rootElement = document.documentElement;
    rootElement.dataset.theme = 'dark';
    rootElement.style.colorScheme = 'dark';
    document.body.dataset.theme = 'dark';
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    if (theme !== 'dark') {
      setTheme('dark');
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme: 'dark',
    isDarkMode: true,
    setTheme: () => setTheme('dark'),
    toggleTheme: () => setTheme('dark')
  }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}