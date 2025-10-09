'use client';

import { ErrorMessage, LoadingSpinner, StatsCard } from '@/app/admin/components';
import type { RestErrorResponse, RestListResponse, RestUserResource, UiUser } from '@/app/admin/types/user-types';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UserRole = UiUser['role'];

/** Individual user card with modern design */
const UserCard = ({ user, onRoleChange, onDeleteUser, onActivateUser, onPermanentDelete }: {
  readonly user: UiUser;
  readonly onRoleChange: (userId: string, newRole: UserRole) => void;
  readonly onDeleteUser: (userId: string, username: string) => void;
  readonly onActivateUser: (userId: string, username: string) => void;
  readonly onPermanentDelete: (userId: string, username: string) => void;
}) => (
  <li className="group">
    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 hover:shadow-lg hover:border-blue-200/50 dark:hover:border-blue-700/50 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <UserHeader user={user} />
          <UserMeta user={user} />
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <RoleToggleButton user={user} onRoleChange={onRoleChange} />
          <UserStateActions
            user={user}
            onDeleteUser={onDeleteUser}
            onActivateUser={onActivateUser}
            onPermanentDelete={onPermanentDelete}
          />
        </div>
      </div>
    </div>
  </li>
);

/** ユーザー情報のヘッダー部分 */
const UserHeader = ({ user }: { user: UiUser }) => (
  <div className="flex items-center gap-3 mb-3">
    {/* アバター */}
    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
      {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {user.displayName}
        </h3>
        {user.role === 'admin' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-800 dark:text-purple-200 border border-purple-200/50 dark:border-purple-700/30">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            管理者
          </span>
        )}
        {!user.isActive && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/20 text-red-800 dark:text-red-200 border border-red-200/50 dark:border-red-700/30">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
            無効
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        @{user.username}
      </p>
    </div>
  </div>
);

/** ユーザーのメタ情報（メールアドレス、登録日など） */
const UserMeta = ({ user }: { user: UiUser }) => (
  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      </svg>
      <span className="truncate">{user.email}</span>
    </div>
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
      <span>登録日: {user.createdAt.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}</span>
    </div>
  </div>
);

/** 役割変更ボタン */
const RoleToggleButton = ({ user, onRoleChange }: { user: UiUser; onRoleChange: (userId: string, newRole: UserRole) => void }) => (
  <button
    onClick={() => onRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-105 ${user.role === 'admin'
      ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white focus:ring-gray-500 shadow-md'
      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-blue-500 shadow-md'
      }`}
    aria-label={`${user.displayName}を${user.role === 'admin' ? '一般ユーザー' : '管理者'}にする`}
  >
    {user.role === 'admin' ? '一般ユーザーにする' : '管理者にする'}
  </button>
);

/** ユーザー状態に応じたアクションボタン（無効化・有効化・完全削除） */
const UserStateActions = ({ user, onDeleteUser, onActivateUser, onPermanentDelete }: {
  user: UiUser;
  onDeleteUser: (userId: string, username: string) => void;
  onActivateUser: (userId: string, username: string) => void;
  onPermanentDelete: (userId: string, username: string) => void;
}) => (
  <>
    {user.isActive ? (
      <button
        onClick={() => onDeleteUser(user.id, user.username)}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 hover:scale-105 shadow-md"
        aria-label={`${user.displayName}を無効化`}
      >
        無効化
      </button>
    ) : (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onActivateUser(user.id, user.username)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 hover:scale-105 shadow-md"
          aria-label={`${user.displayName}を有効化`}
        >
          有効化
        </button>
        <button
          onClick={() => onPermanentDelete(user.id, user.username)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 hover:scale-105 shadow-md"
          aria-label={`${user.displayName}を完全削除`}
        >
          完全削除
        </button>
      </div>
    )}
  </>
);

/** Modern users list with glass morphism design */
const UsersList = ({ users, onRoleChange, onDeleteUser, onActivateUser, onPermanentDelete }: {
  readonly users: readonly UiUser[];
  readonly onRoleChange: (userId: string, newRole: UserRole) => void;
  readonly onDeleteUser: (userId: string, username: string) => void;
  readonly onActivateUser: (userId: string, username: string) => void;
  readonly onPermanentDelete: (userId: string, username: string) => void;
}) => (
  <div className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl overflow-hidden">
    <div className="px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            ユーザー一覧
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ユーザーの詳細情報と権限管理 • {users.length}件
          </p>
        </div>
      </div>
    </div>
    {users.length === 0 ? (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">ユーザーがいません</h4>
        <p className="text-gray-500 dark:text-gray-400">現在表示するユーザーがありません。フィルターを確認してください。</p>
      </div>
    ) : (
      <ul className="p-6 space-y-4" aria-label="ユーザー一覧">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onRoleChange={onRoleChange}
            onDeleteUser={onDeleteUser}
            onActivateUser={onActivateUser}
            onPermanentDelete={onPermanentDelete}
          />
        ))}
      </ul>
    )}
  </div>
);

/** Modern user creation form component */
const UserCreateForm = ({ onCreateUser }: {
  readonly onCreateUser: (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  }) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    role: 'user' as UserRole,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateUser(formData);
    setFormData({
      username: '',
      email: '',
      password: '',
      displayName: '',
      role: 'user',
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新しいユーザーを追加
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              新しいユーザーを作成
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ユーザーアカウントの詳細情報を入力してください
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
              placeholder="username123"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
              placeholder="田中 太郎"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
              placeholder="••••••••"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              役割
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
            >
              <option value="user">一般ユーザー</option>
              <option value="admin">管理者</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:scale-105 shadow-lg"
          >
            作成
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:scale-105"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// RESTful API Client - Type-Safe & High-Performance
// ============================================================================

/**
 * 型安全なRESTful API呼び出し関数
 */
async function fetchRestfulUsers(): Promise<{
  readonly success: true;
  readonly users: readonly UiUser[];
} | {
  readonly success: false;
  readonly error: string;
}> {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store', // 常に最新データを取得
    });

    if (!response.ok) {
      const errorData = await response.json() as RestErrorResponse;
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}: リクエストに失敗しました`,
      };
    }

    const data = await response.json() as RestListResponse<RestUserResource>;

    if (!data.success || !Array.isArray(data.data)) {
      return {
        success: false,
        error: '無効なAPIレスポンス形式です',
      };
    }

    // RESTリソースをUIモデルに変換
    const users: UiUser[] = data.data.map((resource): UiUser => ({
      id: resource.id,
      username: resource.username,
      email: resource.email,
      displayName: resource.displayName,
      role: resource.role,
      isActive: resource.isActive,
      createdAt: new Date(resource.createdAt),
    }));

    return {
      success: true,
      users,
    };
  } catch (err: unknown) {
    console.error('RESTful Users API Error:', err instanceof Error ? err : String(err));
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ネットワークエラーが発生しました',
    };
  }
}

// ============================================================================
// Main Component - High-Performance & Type-Safe
// ============================================================================

export default function AdminUsersPage() {
  // ============================================================================
  // State Management - Optimized with proper typing
  // ============================================================================
  const [users, setUsers] = useState<UiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);

  // ============================================================================
  // Data Fetching - RESTful & Type-Safe
  // ============================================================================
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchRestfulUsers();

      if (result.success) {
        setUsers([...result.users]); // readonlyを通常の配列に変換
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('ユーザー情報の取得に失敗しました');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期ロード
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ============================================================================
  // User Actions - Optimized with proper error handling
  // ============================================================================
  const handleRoleChange = useCallback(async (userId: string, newRole: UserRole) => {
    if (updating.has(userId)) return; // 二重実行を防止

    try {
      setUpdating(prev => new Set(prev).add(userId));

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH', // PUTからPATCHに変更
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: 権限変更に失敗しました`);
      }

      // 楽観的UI更新
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, role: newRole }
            : user
        )
      );

      // 成功メッセージ表示（オプション）
      setError(null);
    } catch (err) {
      console.error('Role change error:', err);
      setError(err instanceof Error ? err.message : '権限変更に失敗しました');

      // エラー時は全データを再取得
      await loadUsers();
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [updating, loadUsers]);

  // ユーザー無効化処理
  const handleDeleteUser = useCallback(async (userId: string, username: string) => {
    if (updating.has(userId)) return; // 二重実行を防止

    // 確認ダイアログ
    if (!confirm(`ユーザー "${username}" を無効化しますか？無効化されたユーザーはログインできなくなります。`)) {
      return;
    }

    try {
      setUpdating(prev => new Set(prev).add(userId));

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ユーザー無効化に失敗しました`);
      }

      // 楽観的UI更新 - ユーザーを無効化（ソフトデリート）
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === userId
          ? { ...user, isActive: false, updatedAt: new Date() }
          : user
      ));
      setError(null);
    } catch (err) {
      console.error('User deactivate error:', err);
      setError(err instanceof Error ? err.message : 'ユーザー無効化に失敗しました');

      // エラー時は全データを再取得
      await loadUsers();
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [updating, loadUsers]);

  // ユーザー有効化処理
  const handleActivateUser = useCallback(async (userId: string, username: string) => {
    if (updating.has(userId)) return; // 二重実行を防止

    // 確認ダイアログ
    if (!confirm(`ユーザー "${username}" を有効化しますか？有効化されたユーザーは再びログインできるようになります。`)) {
      return;
    }

    try {
      setUpdating(prev => new Set(prev).add(userId));

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ユーザー有効化に失敗しました`);
      }

      // 楽観的UI更新 - ユーザーを有効化
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === userId
          ? { ...user, isActive: true, updatedAt: new Date() }
          : user
      ));
      setError(null);
    } catch (err) {
      console.error('User activate error:', err);
      setError(err instanceof Error ? err.message : 'ユーザー有効化に失敗しました');

      // エラー時は全データを再取得
      await loadUsers();
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [updating, loadUsers]);

  // ユーザー完全削除処理
  const handlePermanentDelete = useCallback(async (userId: string, username: string) => {
    if (updating.has(userId)) return; // 二重実行を防止

    // 厳重な確認ダイアログ
    if (!confirm(`⚠️ 警告: ユーザー "${username}" を完全削除しますか？\n\nこの操作は取り消せません。ユーザーのすべてのデータが永久に失われます。\n\n本当に削除しますか？`)) {
      return;
    }

    // 二重確認
    if (!confirm(`最終確認: "${username}" の完全削除を実行しますか？\n\nこの操作は絶対に取り消せません。`)) {
      return;
    }

    try {
      setUpdating(prev => new Set(prev).add(userId));

      // 完全削除用の特別なエンドポイントを作成する必要があります
      const response = await fetch(`/api/users/${userId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ユーザー完全削除に失敗しました`);
      }

      // 楽観的UI更新 - ユーザーをリストから完全に削除
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setError(null);
    } catch (err) {
      console.error('User permanent delete error:', err);
      setError(err instanceof Error ? err.message : 'ユーザー完全削除に失敗しました');

      // エラー時は全データを再取得
      await loadUsers();
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [updating, loadUsers]);

  // ユーザー作成処理
  const handleCreateUser = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  }) => {
    try {
      setError(null);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ユーザー作成に失敗しました`);
      }

      // 作成成功時は全データを再取得
      await loadUsers();
      setError(null);
    } catch (err) {
      console.error('User create error:', err);
      setError(err instanceof Error ? err.message : 'ユーザー作成に失敗しました');
    }
  }, [loadUsers]);

  // ============================================================================
  // Performance Optimizations - Memoized computations
  // ============================================================================
  const stats = useMemo(() => {
    const adminCount = users.filter(user => user.role === 'admin').length;
    const userCount = users.filter(user => user.role === 'user').length;
    const activeCount = users.filter(user => user.isActive).length;

    return {
      total: users.length,
      adminCount,
      userCount,
      activeCount,
    };
  }, [users]);

  // フィルタリングされたユーザーリスト
  const filteredUsers = useMemo(() => {
    return showInactiveUsers
      ? users
      : users.filter(user => user.isActive);
  }, [users, showInactiveUsers]);

  // ============================================================================
  // Render - Clean & Accessible UI
  // ============================================================================
  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-full p-6">
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Modern Hero Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
            <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-white/[0.02]" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    ユーザー管理
                  </h1>
                  <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    ユーザーアカウントの確認と権限管理を行います
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                最終更新: {new Date().toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && <ErrorMessage message={error} />}

          {/* Modern Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="総ユーザー数"
              value={stats.total}
              variant="neutral"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              }
            />
            <StatsCard
              title="管理者"
              value={stats.adminCount}
              variant="warning"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatsCard
              title="一般ユーザー"
              value={stats.userCount}
              variant="primary"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatsCard
              title="アクティブ"
              value={stats.activeCount}
              variant="success"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>

          {/* Modern Control Panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ユーザー一覧
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredUsers.length}件のユーザーを表示中
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactiveUsers}
                  onChange={(e) => setShowInactiveUsers(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 transition-colors"
                />
                <span className="select-none">無効化されたユーザーも表示</span>
              </label>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                    更新中...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    更新
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* ユーザー作成フォーム */}
          <UserCreateForm onCreateUser={handleCreateUser} />

          {/* ユーザーリスト */}
          <UsersList users={filteredUsers} onRoleChange={handleRoleChange} onDeleteUser={handleDeleteUser} onActivateUser={handleActivateUser} onPermanentDelete={handlePermanentDelete} />
        </div>
      </div>
    </AdminLayout>
  );
}
