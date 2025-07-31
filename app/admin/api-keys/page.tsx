'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth';
import AdminLayout from '@/app/lib/AdminLayout';
import { ApiKey, ApiKeyPermissions, defaultPermissions, fullPermissions, readOnlyPermissions } from '@/app/lib/api-keys';

interface ApiKeyForm {
  name: string;
  permissions: ApiKeyPermissions;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
  </div>
);

const Message = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
  <div className={`p-4 rounded-lg ${
    type === 'success' 
      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-600' 
      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-600'
  }`}>
    {message}
  </div>
);

const PermissionToggle = ({ 
  label, 
  checked, 
  onChange, 
  description 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  description?: string;
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      )}
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
    />
  </div>
);

const PermissionEditor = ({ 
  permissions, 
  onChange 
}: { 
  permissions: ApiKeyPermissions; 
  onChange: (permissions: ApiKeyPermissions) => void; 
}) => {
  const updatePermission = (resource: keyof ApiKeyPermissions, action: string, value: boolean) => {
    const newPermissions = {
      ...permissions,
      [resource]: {
        ...permissions[resource],
        [action]: value
      }
    };
    onChange(newPermissions);
  };

  const setPresetPermissions = (preset: ApiKeyPermissions) => {
    onChange(preset);
  };

  return (
    <div className="space-y-6">
      {/* プリセット選択 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">クイック設定</h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPresetPermissions(readOnlyPermissions)}
            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            読み取り専用
          </button>
          <button
            onClick={() => setPresetPermissions(defaultPermissions)}
            className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md hover:bg-green-200 dark:hover:bg-green-800"
          >
            標準権限
          </button>
          <button
            onClick={() => setPresetPermissions(fullPermissions)}
            className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-800"
          >
            全権限
          </button>
        </div>
      </div>

      {/* 投稿権限 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">投稿権限</h4>
        <div className="space-y-2">
          <PermissionToggle
            label="投稿作成"
            description="新しい投稿を作成する権限"
            checked={permissions.posts.create}
            onChange={(checked) => updatePermission('posts', 'create', checked)}
          />
          <PermissionToggle
            label="投稿読み取り"
            description="投稿一覧と詳細を取得する権限"
            checked={permissions.posts.read}
            onChange={(checked) => updatePermission('posts', 'read', checked)}
          />
          <PermissionToggle
            label="投稿更新"
            description="既存の投稿を編集する権限"
            checked={permissions.posts.update}
            onChange={(checked) => updatePermission('posts', 'update', checked)}
          />
          <PermissionToggle
            label="投稿削除"
            description="投稿を削除する権限"
            checked={permissions.posts.delete}
            onChange={(checked) => updatePermission('posts', 'delete', checked)}
          />
        </div>
      </div>

      {/* コメント権限 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">コメント権限</h4>
        <div className="space-y-2">
          <PermissionToggle
            label="コメント読み取り"
            description="コメント一覧を取得する権限"
            checked={permissions.comments.read}
            onChange={(checked) => updatePermission('comments', 'read', checked)}
          />
          <PermissionToggle
            label="コメント管理"
            description="コメントの承認・削除を行う権限"
            checked={permissions.comments.moderate}
            onChange={(checked) => updatePermission('comments', 'moderate', checked)}
          />
        </div>
      </div>

      {/* 設定権限 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">設定権限</h4>
        <div className="space-y-2">
          <PermissionToggle
            label="設定読み取り"
            description="システム設定を読み取る権限"
            checked={permissions.settings.read}
            onChange={(checked) => updatePermission('settings', 'read', checked)}
          />
        </div>
      </div>
    </div>
  );
};

const ApiKeyCard = ({ 
  apiKey, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: { 
  apiKey: ApiKey; 
  onEdit: (apiKey: ApiKey) => void; 
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) => (
  <div className={`p-6 rounded-lg border ${apiKey.isActive 
    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
    : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600'
  }`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{apiKey.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{apiKey.key}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${apiKey.isActive 
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}>
          {apiKey.isActive ? 'アクティブ' : '無効'}
        </span>
      </div>
    </div>

    <div className="mb-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        作成日: {new Date(apiKey.createdAt).toLocaleString('ja-JP')}
      </p>
      {apiKey.lastUsed && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          最終使用: {new Date(apiKey.lastUsed).toLocaleString('ja-JP')}
        </p>
      )}
    </div>

    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">権限</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="font-medium">投稿:</span>
          <span className="ml-1 text-gray-600 dark:text-gray-400">
            {[
              apiKey.permissions.posts.create && '作成',
              apiKey.permissions.posts.read && '読取',
              apiKey.permissions.posts.update && '更新',
              apiKey.permissions.posts.delete && '削除'
            ].filter(Boolean).join(', ') || 'なし'}
          </span>
        </div>
        <div>
          <span className="font-medium">コメント:</span>
          <span className="ml-1 text-gray-600 dark:text-gray-400">
            {[
              apiKey.permissions.comments.read && '読取',
              apiKey.permissions.comments.moderate && '管理'
            ].filter(Boolean).join(', ') || 'なし'}
          </span>
        </div>
      </div>
    </div>

    <div className="flex gap-2">
      <button
        onClick={() => onEdit(apiKey)}
        className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
      >
        編集
      </button>
      <button
        onClick={() => onToggleActive(apiKey.id, !apiKey.isActive)}
        className={`px-3 py-1 text-xs rounded-md transition-colors ${apiKey.isActive
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
          : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {apiKey.isActive ? '無効化' : '有効化'}
      </button>
      <button
        onClick={() => onDelete(apiKey.id)}
        className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
      >
        削除
      </button>
    </div>
  </div>
);

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState<ApiKeyForm>({
    name: '',
    permissions: defaultPermissions
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/api-keys', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('APIキーの読み込みに失敗しました');
      }
      
      const data = await response.json();
      setApiKeys(data.apiKeys);
    } catch (error) {
      console.error('APIキー読み込みエラー:', error);
      setMessage('APIキーの読み込みに失敗しました');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIキーの作成に失敗しました');
      }

      const data = await response.json();
      setNewKeyValue(data.apiKey.key);
      setMessage('APIキーが正常に作成されました');
      setMessageType('success');
      setShowCreateForm(false);
      setFormData({ name: '', permissions: defaultPermissions });
      await loadApiKeys();
    } catch (error) {
      console.error('APIキー作成エラー:', error);
      setMessage(error instanceof Error ? error.message : 'APIキーの作成中にエラーが発生しました');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateApiKey = async () => {
    if (!editingKey) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/api-keys/${editingKey.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIキーの更新に失敗しました');
      }

      setMessage('APIキーが正常に更新されました');
      setMessageType('success');
      setEditingKey(null);
      setFormData({ name: '', permissions: defaultPermissions });
      await loadApiKeys();
    } catch (error) {
      console.error('APIキー更新エラー:', error);
      setMessage(error instanceof Error ? error.message : 'APIキーの更新中にエラーが発生しました');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('このAPIキーを削除してもよろしいですか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIキーの削除に失敗しました');
      }

      setMessage('APIキーが正常に削除されました');
      setMessageType('success');
      await loadApiKeys();
    } catch (error) {
      console.error('APIキー削除エラー:', error);
      setMessage(error instanceof Error ? error.message : 'APIキーの削除中にエラーが発生しました');
      setMessageType('error');
    }
  };

  const toggleApiKeyActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIキーの更新に失敗しました');
      }

      setMessage(`APIキーが${isActive ? '有効' : '無効'}になりました`);
      setMessageType('success');
      await loadApiKeys();
    } catch (error) {
      console.error('APIキー状態変更エラー:', error);
      setMessage(error instanceof Error ? error.message : 'APIキーの状態変更中にエラーが発生しました');
      setMessageType('error');
    }
  };

  const startEdit = (apiKey: ApiKey) => {
    setEditingKey(apiKey);
    setFormData({
      name: apiKey.name,
      permissions: apiKey.permissions
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setShowCreateForm(false);
    setFormData({ name: '', permissions: defaultPermissions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKey) {
      updateApiKey();
    } else {
      createApiKey();
    }
  };

  const clearMessage = () => {
    setMessage('');
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return editingKey ? '更新中...' : '作成中...';
    }
    return editingKey ? 'APIキーを更新' : 'APIキーを作成';
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoading || !user) {
    return (
      <AdminLayout title="APIキー管理">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="APIキー管理">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">APIキー管理</h1>
            <p className="text-gray-600 dark:text-gray-400">外部アプリケーション用のAPIキーを管理します</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            新しいAPIキーを作成
          </button>
        </div>

        {message && <Message message={message} type={messageType} />}

        {newKeyValue && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">新しいAPIキーが作成されました</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              このAPIキーは一度だけ表示されます。安全な場所に保存してください。
            </p>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border font-mono text-sm break-all">
              {newKeyValue}
            </div>
            <button
              onClick={() => setNewKeyValue('')}
              className="mt-3 px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
            >
              確認しました
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingKey ? 'APIキーを編集' : '新しいAPIキーを作成'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  APIキー名
                </label>
                <input
                  id="keyName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="例: モバイルアプリ用キー"
                  required
                />
              </div>

              <PermissionEditor
                permissions={formData.permissions}
                onChange={(permissions) => setFormData(prev => ({ ...prev, permissions }))}
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white'
                  }`}
                >
                  {getSubmitButtonText()}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {apiKeys.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">APIキーがまだ作成されていません。</p>
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <ApiKeyCard
                key={apiKey.id}
                apiKey={apiKey}
                onEdit={startEdit}
                onDelete={deleteApiKey}
                onToggleActive={toggleApiKeyActive}
              />
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
