/**
 * 認証関連カスタムフック（統合版）
 * 
 * ユーザー関連の機能で使用される各種フックを提供し、
 * 既存のコンポーネントとの互換性を保ちます。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '../../core/types';

// ============================================================================
// ユーザープロフィール関連フック
// ============================================================================

/**
 * ユーザープロフィールフック
 */
export function useUserProfile(userId?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    user,
    loading,
    error,
    updateProfile,
    refetch: fetchUser
  };
}

// ============================================================================
// ユーザーアクション関連フック
// ============================================================================

/**
 * ユーザーアクションフック
 */
export function useUserActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ role })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const banUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to ban user');
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    deleteUser,
    updateUserRole,
    banUser
  };
}

// ============================================================================
// 認証状態フック
// ============================================================================

/**
 * 認証データフック（コンテキストを使わないバージョン）
 */
export function useAuthData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        localStorage.removeItem('auth-token');
        setUser(null);
        return;
      }
      
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      localStorage.removeItem('auth-token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('auth-token', data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth-token');
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
}

// 管理者機能フック（互換性のため）
export { useAdminPosts, useAdminStats, usePostActions } from '../../admin-hooks';
