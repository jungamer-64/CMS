/**
 * 統合テーマコンテキスト
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface ThemeContextType {
  readonly isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // システムの設定を確認
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // ローカルストレージから設定を取得（'theme'キーを使用）
    const stored = localStorage.getItem('theme');
    const initialDarkMode = stored === 'dark' || (!stored && systemPrefersDark);

    setIsDarkMode(initialDarkMode);
    updateDocumentClass(initialDarkMode);
  }, []);

  const updateDocumentClass = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateDocumentClass(isDark);
  };

  const toggleDarkMode = () => {
    setDarkMode(!isDarkMode);
  };

  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
