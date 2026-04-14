'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'genesis-ai-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // 应用主题
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let currentTheme: 'light' | 'dark';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
      currentTheme = systemTheme;
    } else {
      currentTheme = theme;
    }

    root.classList.add(currentTheme);
    setResolvedTheme(currentTheme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'light' : 'dark';
      setResolvedTheme(systemTheme);
      window.document.documentElement.classList.remove('light', 'dark');
      window.document.documentElement.classList.add(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 主题切换按钮组件
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '⚙️';
  };

  const getLabel = () => {
    if (theme === 'light') return '亮色模式';
    if (theme === 'dark') return '暗色模式';
    return '跟随系统';
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition text-sm focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
      aria-label={`切换主题，当前为${getLabel()}`}
      title={getLabel()}
    >
      <span className="text-lg">{getIcon()}</span>
    </button>
  );
}
