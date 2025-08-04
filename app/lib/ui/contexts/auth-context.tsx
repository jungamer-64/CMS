/**
 * 統合認証コンテキスト
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User, ApiResponse } from '../../core/types';
import { isApiSuccess } from '../../core/utils/type-guards';

export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
}

export interface RegisterData {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface AuthContextType {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data: ApiResponse<{user: User}> = await response.json();
        if (isApiSuccess(data)) {
          console.log('受信したユーザーデータ:', data.data.user); // デバッグログ
          setUser(data.data.user); // data.data.userからユーザー情報を取得
        } else {
          console.log('API失敗:', data); // デバッグログ
          setUser(null);
        }
      } else if (response.status === 401) {
        // 401 Unauthorized は正常（ログインしていない状態）
        // エラーログを出力せずに静かに処理
        setUser(null);
      } else {
        console.error('Failed to refresh user:', response.status, response.statusText);
        setUser(null);
      }
    } catch (error) {
      // ネットワークエラーなどの実際のエラーのみログ出力
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error during user refresh:', error);
      } else {
        console.error('Failed to refresh user:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // レスポンスからエラーメッセージを取得
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            const errorMessage = errorData.error || errorData.message || 'ログインに失敗しました';
            throw new Error(errorMessage);
          } else {
            // JSONでない場合（HTMLページなど）
            const textResponse = await response.text();
            console.error('Non-JSON response:', textResponse.substring(0, 200));
            throw new Error(`ログインに失敗しました (HTTP ${response.status})`);
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          throw new Error(`ログインに失敗しました (HTTP ${response.status})`);
        }
      }

      // レスポンスの内容を確認
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const loginData = await response.json();
          console.log('ログインレスポンス:', loginData);
        } else {
          const textResponse = await response.text();
          console.error('Expected JSON but received:', textResponse.substring(0, 200));
          throw new Error('サーバーから予期しないレスポンスが返されました');
        }
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError);
        throw new Error('ログインレスポンスの解析に失敗しました');
      }

      await refreshUser();
    } catch (error) {
      setIsLoading(false);
      console.error('Login error details:', error);
      throw error;
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      await refreshUser();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [refreshUser]);

  useEffect(() => {
    // 初回ロード時のみ、少し遅延してから認証状態をチェック
    // これにより、必要なクッキーが設定される時間を確保
    const timeoutId = setTimeout(() => {
      refreshUser();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [refreshUser]);

  const contextValue: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshUser,
  }), [user, isLoading, login, logout, register, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
