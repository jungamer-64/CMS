'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User } from './types';
import type { ApiResponse, AuthResponse } from './api-types';

// 型安全性のための厳密な型定義
interface AuthUser extends Omit<User, 'passwordHash'> {
  readonly passwordHash: '';
}

interface AuthContextType {
  readonly user: AuthUser | null;
  readonly login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  readonly logout: () => Promise<void>;
  readonly isLoading: boolean;
  readonly refreshAuth: () => Promise<void>;
}

// キャッシュ設定（認証状態のキャッシュ期間：5分）
const AUTH_CACHE_DURATION = 5 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastCheckedRef = useRef<number | null>(null);
  const authPromiseRef = useRef<Promise<void> | null>(null);

  // 型ガード: ApiResponse<T> の success 判定（インライン化で高速化）
  const isApiSuccess = useCallback(<T,>(res: unknown): res is { success: true; data: T } => {
    return Boolean(res && typeof res === 'object' && (res as Record<string, unknown>).success === true && 'data' in res);
  }, []);

  // User型からAuthUser型への変換（型安全性保証）
  const convertToAuthUser = useCallback((userData: User): AuthUser => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = userData;
    return { ...userWithoutPassword, passwordHash: '' as const };
  }, []);

  // 認証状態確認の最適化版（重複リクエスト防止、キャッシュ機能付き）
  const checkAuthStatus = useCallback(async (force = false): Promise<void> => {
    const now = Date.now();
    
    // キャッシュチェック（強制更新でない場合）
    if (!force && lastCheckedRef.current && (now - lastCheckedRef.current < AUTH_CACHE_DURATION)) {
      setIsLoading(false);
      return;
    }

    // 既に実行中のリクエストがある場合は待機
    if (authPromiseRef.current) {
      return authPromiseRef.current;
    }

    const authPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

        const response = await fetch('/api/auth/me', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          setUser(null);
          return;
        }

        const res: ApiResponse<User> = await response.json();
        
        if (isApiSuccess<User>(res)) {
          const authUser = convertToAuthUser(res.data);
          setUser(authUser);
          lastCheckedRef.current = now;
        } else {
          setUser(null);
        }
      } catch (error) {
        // AbortErrorは無視（意図的なキャンセル）
        if ((error as Error).name !== 'AbortError') {
          console.error('認証状態の確認に失敗:', error);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
        authPromiseRef.current = null;
      }
    })();

    authPromiseRef.current = authPromise;
    return authPromise;
  }, [isApiSuccess, convertToAuthUser]);

  useEffect(() => {
    // ページ読み込み時に認証状態を確認
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 高速化されたログイン機能（重複リクエスト防止付き）
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'ユーザー名とパスワードを入力してください' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const res: ApiResponse<AuthResponse> = await response.json();
      
      if (!response.ok || !isApiSuccess<AuthResponse>(res)) {
        return { 
          success: false, 
          error: res && 'error' in res ? res.error : 'ログインに失敗しました' 
        };
      }

      // 認証成功時の処理を最適化
      const authUser = convertToAuthUser({ ...res.data.user, passwordHash: '' } as User);
      setUser(authUser);
      lastCheckedRef.current = Date.now();
      
      return { success: true };
    } catch (error) {
      console.error('ログインエラー:', error);
      if ((error as Error).name === 'AbortError') {
        return { success: false, error: 'ログインがタイムアウトしました' };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'ログインに失敗しました' 
      };
    }
  }, [isApiSuccess, convertToAuthUser]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

      await fetch('/api/auth/logout', { 
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      // ログアウトエラーでも状態はクリアする
      if ((error as Error).name !== 'AbortError') {
        console.error('ログアウトエラー:', error);
      }
    } finally {
      setUser(null);
      lastCheckedRef.current = null;
      authPromiseRef.current = null;
    }
  }, []);

  // 認証状態の強制更新機能
  const refreshAuth = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await checkAuthStatus(true);
  }, [checkAuthStatus]);

  const value = useMemo(() => ({
    user,
    login,
    logout,
    isLoading,
    refreshAuth,
  }), [user, login, logout, isLoading, refreshAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthはAuthProvider内で使用する必要があります');
  }
  return context;
}
