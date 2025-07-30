'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  startPreview: (duration?: number) => void;
  isPreviewActive: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [savedTheme, setSavedTheme] = useState(false);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const savedThemeRef = useRef(savedTheme);
  const isPreviewActiveRef = useRef(isPreviewActive);
  const previewTimerRef = useRef(previewTimer);

  useEffect(() => {
    console.log('ThemeProvider initializing...');
    // ローカルストレージからダークモード設定を読み込み
    const savedThemeValue = localStorage.getItem('darkMode');
    let darkModeEnabled = false;
    
    if (savedThemeValue !== null) {
      darkModeEnabled = JSON.parse(savedThemeValue);
      console.log('Found saved theme:', darkModeEnabled);
    } else {
      // システムの設定を確認
      darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('Using system theme:', darkModeEnabled);
    }
    
    console.log('Setting initial dark mode:', darkModeEnabled);
    setIsDarkMode(darkModeEnabled);
    setSavedTheme(darkModeEnabled);
    applyTheme(darkModeEnabled);
  }, []);

  // savedThemeRefを最新の値に同期
  useEffect(() => {
    savedThemeRef.current = savedTheme;
  }, [savedTheme]);

  // 状態をrefに同期
  useEffect(() => {
    isPreviewActiveRef.current = isPreviewActive;
    previewTimerRef.current = previewTimer;
  }, [isPreviewActive, previewTimer]);

  // プレビュータイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (previewTimer) {
        console.log('Cleaning up preview timer on unmount');
        clearTimeout(previewTimer);
      }
    };
  }, [previewTimer]);

  // パス変更を監視してプレビューを終了
  useEffect(() => {
    if (pathname !== previousPathnameRef.current && isPreviewActiveRef.current) {
      console.log('Pathname changed from', previousPathnameRef.current, 'to', pathname, '- ending preview');
      
      // タイマーをクリア
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        setPreviewTimer(null);
      }
      
      // 保存されたテーマに戻す
      const currentSavedTheme = savedThemeRef.current;
      setIsDarkMode(currentSavedTheme);
      applyTheme(currentSavedTheme);
      setIsPreviewActive(false);
    }
    previousPathnameRef.current = pathname;
  }, [pathname]); // 依存配列を最小限に

  const applyTheme = (darkMode: boolean) => {
    console.log('Applying theme:', darkMode);
    const htmlElement = document.documentElement;
    if (darkMode) {
      htmlElement.classList.add('dark');
      console.log('Added dark class to html element');
    } else {
      htmlElement.classList.remove('dark');
      console.log('Removed dark class from html element');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    console.log('Toggling dark mode:', isDarkMode, '->', newDarkMode);
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    applyTheme(newDarkMode);
  };

  const setDarkMode = (enabled: boolean) => {
    console.log('Setting dark mode:', enabled);
    setIsDarkMode(enabled);
    setSavedTheme(enabled);
    localStorage.setItem('darkMode', JSON.stringify(enabled));
    applyTheme(enabled);
    
    // プレビューモードを終了
    if (previewTimer) {
      clearTimeout(previewTimer);
      setPreviewTimer(null);
    }
    setIsPreviewActive(false);
  };

  const startPreview = useCallback((duration: number = 3000) => {
    console.log('Starting preview mode');
    
    // 既存のプレビューをクリア
    if (previewTimer) {
      clearTimeout(previewTimer);
    }
    
    setIsPreviewActive(true);
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyTheme(newMode);
    
    // 指定時間後に元に戻す
    const timer = setTimeout(() => {
      console.log('Reverting preview to saved theme:', savedTheme);
      setIsDarkMode(savedTheme);
      applyTheme(savedTheme);
      setIsPreviewActive(false);
      setPreviewTimer(null);
    }, duration);
    
    setPreviewTimer(timer);
  }, [isDarkMode, previewTimer, savedTheme]);

  const contextValue = useMemo(() => ({
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    startPreview,
    isPreviewActive,
  }), [isDarkMode, isPreviewActive]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
