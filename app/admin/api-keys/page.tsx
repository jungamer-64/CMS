'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import AdminLayout from '../../lib/AdminLayout';
import { ApiKeyPermissions } from '../../lib/types';

interface APIKey {
  _id: string;
  keyPrefix: string;
  name: string;
  permissions: ApiKeyPermissions;
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
    {message}
  </div>
);

const StatsCard = ({ title, value, icon, bgColor }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  bgColor: string; 
}) => (
  <div className={`${bgColor} dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700`}>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const KeyIcon = () => (
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

export default function APIKeysPage() {
  const { user, isLoading } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<ApiKeyPermissions>({
    posts: {
      create: false,
      read: true,
      update: false,
      delete: false
    },
    comments: {
      read: true,
      moderate: false,
      delete: false
    },
    users: {
      read: false,
      create: false,
      update: false,
      delete: false
    },
    settings: {
      read: false,
      update: false
    },
    uploads: {
      create: false,
      read: true,
      delete: false
    }
  });

  useEffect(() => {
    if (!isLoading && user) {
      fetchAPIKeys();
    }
  }, [user, isLoading]);

  const fetchAPIKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) {
        throw new Error('APIキーの取得に失敗しました');
      }
      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      setError('APIキー名を入力してください');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'APIキーの作成に失敗しました');
      }

      const data = await response.json();
      
      // 新しいキーを表示するためのアラート
      alert(`新しいAPIキーが作成されました:\n${data.apiKey}\n\nこのキーは二度と表示されません。安全な場所に保存してください。`);
      
      // フォームをリセット
      setNewKeyName('');
      setNewKeyPermissions({
        posts: {
          create: false,
          read: true,
          update: false,
          delete: false
        },
        comments: {
          read: true,
          moderate: false,
          delete: false
        },
        users: {
          read: false,
          create: false,
          update: false,
          delete: false
        },
        settings: {
          read: false,
          update: false
        },
        uploads: {
          create: false,
          read: true,
          delete: false
        }
      });
      setShowCreateForm(false);

      // APIキーリストを更新
      await fetchAPIKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setCreating(false);
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('このAPIキーを削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('APIキーの削除に失敗しました');
      }

      await fetchAPIKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="APIキー管理">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="APIキー管理">
        <div className="flex justify-center items-center min-h-screen">認証が必要です</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="APIキー管理">
      <div className="space-y-6">
        {/* ページヘッダー */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">APIキー管理</h1>
              <p className="text-slate-100">アカウントのAPIキーを管理し、権限を設定できます。</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-slate-800 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors font-medium"
            >
              + 新しいAPIキーを作成
            </button>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="総APIキー数"
            value={apiKeys.length}
            icon={<KeyIcon />}
            bgColor="bg-white"
          />
          <StatsCard
            title="アクティブキー"
            value={apiKeys.filter(key => !key.expiresAt || new Date(key.expiresAt) > new Date()).length}
            icon={<KeyIcon />}
            bgColor="bg-white"
          />
          <StatsCard
            title="管理権限キー"
            value={apiKeys.filter(key => 
              key.permissions.users.create || 
              key.permissions.users.update || 
              key.permissions.users.delete ||
              key.permissions.settings.update
            ).length}
            icon={<KeyIcon />}
            bgColor="bg-white"
          />
        </div>

        {error && <ErrorMessage message={error} />}

        {/* APIキー作成フォーム（モーダル風） */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">新しいAPIキーを作成</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    APIキー名
                  </label>
                  <input
                    type="text"
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="例: 本番環境用キー"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 投稿管理権限 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      投稿管理
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.posts.read}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            posts: { ...prev.posts, read: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        投稿を読み取り
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.posts.create}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            posts: { ...prev.posts, create: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        投稿を作成
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.posts.update}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            posts: { ...prev.posts, update: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        投稿を更新
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.posts.delete}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            posts: { ...prev.posts, delete: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        投稿を削除
                      </label>
                    </div>
                  </div>

                  {/* コメント管理権限 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      コメント管理
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.comments.read}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            comments: { ...prev.comments, read: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        コメントを読み取り
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.comments.moderate}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            comments: { ...prev.comments, moderate: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        コメントを承認
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.comments.delete}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            comments: { ...prev.comments, delete: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        コメントを削除
                      </label>
                    </div>
                  </div>

                  {/* ユーザー管理権限 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      ユーザー管理
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.users.read}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            users: { ...prev.users, read: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        ユーザー情報を読み取り
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.users.create}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            users: { ...prev.users, create: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        ユーザーを作成
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.users.update}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            users: { ...prev.users, update: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        ユーザー情報を更新
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.users.delete}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            users: { ...prev.users, delete: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        ユーザーを削除
                      </label>
                    </div>
                  </div>

                  {/* 画像管理権限 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      画像管理
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.uploads.read}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            uploads: { ...prev.uploads, read: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        画像を読み取り
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.uploads.create}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            uploads: { ...prev.uploads, create: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        画像をアップロード
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.uploads.delete}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            uploads: { ...prev.uploads, delete: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        画像を削除
                      </label>
                    </div>
                  </div>

                  {/* 設定管理権限 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      設定管理
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.settings.read}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            settings: { ...prev.settings, read: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        設定を読み取り
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.settings.update}
                          onChange={(e) => setNewKeyPermissions(prev => ({
                            ...prev,
                            settings: { ...prev.settings, update: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        設定を更新
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={createAPIKey}
                    disabled={creating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {creating ? '作成中...' : 'APIキーを作成'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 既存のAPIキー一覧 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">既存のAPIキー</h2>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {apiKeys.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">APIキーが見つかりません</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          名前
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          キープレフィックス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          権限
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          最終使用
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          作成日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {apiKeys.map((key) => (
                        <tr key={key._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {key.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {key.keyPrefix}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-wrap gap-1">
                              {/* 投稿管理権限 */}
                              {(key.permissions.posts.create || key.permissions.posts.read || key.permissions.posts.update || key.permissions.posts.delete) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                  投稿管理
                                </span>
                              )}
                              {/* コメント管理権限 */}
                              {(key.permissions.comments.read || key.permissions.comments.moderate || key.permissions.comments.delete) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                                  コメント管理
                                </span>
                              )}
                              {/* ユーザー管理権限 */}
                              {(key.permissions.users.create || key.permissions.users.read || key.permissions.users.update || key.permissions.users.delete) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                                  ユーザー管理
                                </span>
                              )}
                              {/* 画像管理権限 */}
                              {(key.permissions.uploads.create || key.permissions.uploads.read || key.permissions.uploads.delete) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                                  画像管理
                                </span>
                              )}
                              {/* 設定管理権限 */}
                              {(key.permissions.settings.read || key.permissions.settings.update) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
                                  設定管理
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : '未使用'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(key.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteAPIKey(key._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}