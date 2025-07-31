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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const savedThemeRef = useRef(savedTheme);
  const isPreviewActiveRef = useRef(isPreviewActive);
  const previewTimerRef = useRef(previewTimer);

  // 認証状態の確認
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const responseData = await response.json();
        const userData = responseData.data || responseData;
        console.log('認証されたユーザーのダークモード設定:', userData.darkMode);
        setIsAuthenticated(true);
        return userData.darkMode ?? false;
      } else {
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      setIsAuthenticated(false);
      return null;
    }
  }, []); // 依存関係を削除して無限ループを防ぐ

  // サーバーにダークモード設定を保存
  const saveThemeToServer = useCallback(async (darkMode: boolean) => {
    if (!isAuthenticated) {
      console.log('未認証のため、サーバーに保存しません');
      return;
    }

    try {
      const response = await fetch('/api/user/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ darkMode }),
      });

      if (response.ok) {
        console.log('ダークモード設定をサーバーに保存しました:', darkMode);
      } else {
        console.error('サーバーへの保存に失敗しました');
      }
    } catch (error) {
      console.error('サーバー保存エラー:', error);
    }
  }, [isAuthenticated]);

  // テーマの適用
  const applyTheme = useCallback((darkMode: boolean) => {
    if (typeof window === 'undefined') return;
    
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    console.log('Applied theme:', darkMode ? 'dark' : 'light');
  }, []);

  // 初期化処理
  useEffect(() => {
    console.log('ThemeProvider initializing...');
    
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') {
      console.log('Server-side rendering, skipping initialization');
      return;
    }
    
    const initializeTheme = async () => {
      // まず認証状態を確認
      const serverDarkMode = await checkAuthStatus();
      
      let darkModeEnabled = false;
      
      if (serverDarkMode !== null) {
        // 認証済み: サーバーの設定を使用
        console.log('認証済み - サーバー設定を使用:', serverDarkMode);
        darkModeEnabled = serverDarkMode;
      } else {
        // 未認証: ローカルストレージまたはシステム設定を使用
        console.log('未認証 - ローカル設定を使用');
        try {
          const savedThemeValue = localStorage.getItem('darkMode');
          if (savedThemeValue !== null && savedThemeValue !== undefined && savedThemeValue !== 'undefined') {
            darkModeEnabled = JSON.parse(savedThemeValue);
            console.log('Found saved local theme:', darkModeEnabled);
          } else {
            // システムの設定を確認
            darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
            console.log('Using system theme:', darkModeEnabled);
          }
        } catch (error) {
          console.error('Error parsing saved theme:', error);
          darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      }
      
      // 初期設定を適用
      console.log('Setting initial dark mode:', darkModeEnabled);
      setIsDarkMode(darkModeEnabled);
      setSavedTheme(darkModeEnabled);
      applyTheme(darkModeEnabled);
      
      // 初期化完了
      setIsInitialized(true);
    };
    
    initializeTheme();
  }, [checkAuthStatus, applyTheme]);

  // 認証状態が変わった時の処理（ログイン/ログアウト）
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('認証状態変更:', isAuthenticated);
    
    if (!isAuthenticated) {
      // ログアウト時: ローカルストレージに現在の設定を保存
      console.log('ログアウト検出 - ローカルストレージに保存');
      try {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
      } catch (error) {
        console.error('ローカルストレージ保存エラー:', error);
      }
    }
  }, [isAuthenticated, isDarkMode, isInitialized]); // 認証状態とダークモードの変更を監視

  // ダークモード切り替え時の保存処理
  useEffect(() => {
    if (!isInitialized) return;
    
    // プレビュー中は保存しない
    if (isPreviewActive) {
      console.log('プレビュー中のため保存をスキップ');
      return;
    }
    
    if (isAuthenticated) {
      // 認証済み: サーバーに保存
      saveThemeToServer(isDarkMode);
    } else {
      // 未認証: ローカルストレージに保存
      try {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        console.log('ローカルストレージに保存:', isDarkMode);
      } catch (error) {
        console.error('ローカルストレージ保存エラー:', error);
      }
    }
    
    // 保存されたテーマを更新（プレビュー中でない場合のみ）
    setSavedTheme(isDarkMode);
  }, [isDarkMode, isAuthenticated, isInitialized, isPreviewActive, saveThemeToServer]);

  // RefをCurrentValueで更新
  useEffect(() => {
    savedThemeRef.current = savedTheme;
  }, [savedTheme]);

  // プレビュー状態管理
  useEffect(() => {
    isPreviewActiveRef.current = isPreviewActive;
    previewTimerRef.current = previewTimer;
  }, [isPreviewActive, previewTimer]);

  // ページ遷移時の処理
  useEffect(() => {
    const currentPathname = pathname;
    const previousPathname = previousPathnameRef.current;
    
    console.log('Route change detected:', { from: previousPathname, to: currentPathname });
    
    if (currentPathname === '/admin/settings' && previousPathname !== '/admin/settings') {
      // 設定ページに入る時は現在のテーマを保持
      console.log('Entering settings page, preserving current theme');
    } else if (previousPathname === '/admin/settings' && currentPathname !== '/admin/settings') {
      // 設定ページから出る時の処理
      if (isPreviewActiveRef.current) {
        console.log('Leaving settings page during preview, reverting to saved theme');
        setIsDarkMode(savedThemeRef.current);
        applyTheme(savedThemeRef.current);
        setIsPreviewActive(false);
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
          setPreviewTimer(null);
        }
      }
    }
    
    previousPathnameRef.current = currentPathname;
  }, [pathname, applyTheme]);

  // テーマの適用
  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode, applyTheme]);

  // ダークモード切り替え関数
  const toggleDarkMode = useCallback(() => {
    console.log('Toggling dark mode from', isDarkMode, 'to', !isDarkMode);
    setIsDarkMode(prev => !prev);
  }, [isDarkMode]);

  // ダークモード設定関数
  const setDarkMode = useCallback((enabled: boolean) => {
    console.log('Setting dark mode to:', enabled);
    setIsDarkMode(enabled);
  }, []);

  // プレビュー開始関数
  const startPreview = useCallback((duration: number = 5000) => {
    console.log('Starting theme preview for', duration, 'ms');
    
    // 現在のテーマを保存テーマとして記録
    setSavedTheme(isDarkMode);
    setIsPreviewActive(true);
    
    // 既存のタイマーをクリア
    if (previewTimer) {
      clearTimeout(previewTimer);
    }
    
    // 新しいタイマーを設定
    const timer = setTimeout(() => {
      console.log('Preview timeout, reverting to saved theme');
      setIsDarkMode(savedTheme);
      setIsPreviewActive(false);
      setPreviewTimer(null);
    }, duration);
    
    setPreviewTimer(timer);
  }, [previewTimer, isDarkMode, savedTheme]);

  const contextValue = useMemo(() => ({
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    startPreview,
    isPreviewActive,
  }), [isDarkMode, toggleDarkMode, setDarkMode, startPreview, isPreviewActive]);

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
