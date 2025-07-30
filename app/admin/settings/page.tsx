'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth';
import { useTheme } from '@/app/lib/ThemeContext';
import AdminLayout from '@/app/lib/AdminLayout';

interface Settings {
  darkMode: boolean;
  apiAccess: boolean;
  apiKey: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  maxPostsPerPage: number;
  allowComments: boolean;
  requireApproval: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    darkMode: false,
    apiAccess: true,
    apiKey: '',
    emailNotifications: true,
    maintenanceMode: false,
    maxPostsPerPage: 10,
    allowComments: true,
    requireApproval: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { user } = useAuth();
  const { isDarkMode, setDarkMode, startPreview, isPreviewActive } = useTheme();

  useEffect(() => {
    console.log('Settings useEffect triggered:', { user: user?.role, isDarkMode });
    if (user && user.role === 'admin') {
      loadSettings();
    }
  }, [user]); // isDarkModeの依存関係を削除して循環を防ぐ

  // テーマ同期のuseEffectを削除 - 設定変更は保存時のみ適用

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded settings from API:', data);
        console.log('Current theme state:', isDarkMode);
        
        // APIからの設定をそのまま設定画面に表示
        // 現在のテーマ状態は保持し、保存されている設定を表示
        setSettings(data);
        
        // 保存されているダークモード設定と現在のテーマ状態が異なる場合は、
        // 保存されている設定をテーマに反映
        if (data.darkMode !== isDarkMode) {
          console.log('Applying saved dark mode setting:', data.darkMode);
          setDarkMode(data.darkMode);
        }
      } else {
        console.error('設定読み込み失敗:', response.status);
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      console.log('Saving settings:', settings);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('設定が正常に保存されました');
        setMessageType('success');
        
        // テーマの状態をグローバルに反映
        console.log('Syncing dark mode setting:', settings.darkMode);
        setDarkMode(settings.darkMode);
      } else {
        const errorData = await response.json();
        console.error('設定保存失敗:', response.status, errorData);
        setMessage(`設定の保存に失敗しました: ${errorData.error || 'Unknown error'}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage('設定の保存中にエラーが発生しました');
      setMessageType('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const generateNewApiKey = () => {
    const newKey = 'api_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    setSettings(prev => ({ ...prev, apiKey: newKey }));
  };

  const handleInputChange = (key: keyof Settings, value: any) => {
    console.log('Setting change:', key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // ダークモード設定は保存時のみ適用するため、ここでは即座に変更しない
    // if (key === 'darkMode') {
    //   console.log('Changing dark mode to:', value);
    //   setDarkMode(value);
    // }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout title="設定">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="設定">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-gray-900 dark:text-white">システム設定</h1>
            <p className="text-gray-600 dark:text-gray-400">アプリケーションの動作やセキュリティの設定</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isSaving
                  ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
              }`}
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-400 dark:border-green-600' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-400 dark:border-red-600'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 表示設定 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">表示設定</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ダークモード</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">管理画面のテーマを暗色にします（保存後に適用）</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      console.log('Preview button clicked');
                      console.log('startPreview function available:', typeof startPreview);
                      console.log('isPreviewActive current state:', isPreviewActive);
                      try {
                        startPreview(3000);
                        console.log('startPreview called successfully');
                      } catch (error) {
                        console.error('Error calling startPreview:', error);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      isPreviewActive 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white'
                    }`}
                  >
                    {isPreviewActive ? 'プレビュー中...' : 'プレビュー'}
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.darkMode}
                      onChange={(e) => handleInputChange('darkMode', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ページあたりの投稿数
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={settings.maxPostsPerPage}
                  onChange={(e) => handleInputChange('maxPostsPerPage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* API設定 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">API設定</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">APIアクセス</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">外部APIからのアクセスを許可します</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.apiAccess}
                    onChange={(e) => handleInputChange('apiAccess', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  APIキー
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={settings.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="APIキーを入力または生成"
                  />
                  <button
                    onClick={generateNewApiKey}
                    className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    生成
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* システム設定 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">システム設定</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">メンテナンスモード</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">サイトを一時的に非公開にします</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">メール通知</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">新規投稿やコメントの通知を受け取ります</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* コメント設定 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">コメント設定</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">コメント機能</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">投稿へのコメントを許可します</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.allowComments}
                    onChange={(e) => handleInputChange('allowComments', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">承認が必要</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">コメントの公開前に管理者の承認を求めます</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.requireApproval}
                    onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                    disabled={!settings.allowComments}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${!settings.allowComments ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* システム情報 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">システム情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300">Node.js バージョン</h3>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{process.version}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300">Next.js バージョン</h3>
              <p className="text-lg font-bold text-gray-900 dark:text-white">15.4.5</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300">データベース</h3>
              <p className="text-lg font-bold text-gray-900 dark:text-white">MongoDB</p>
            </div>
          </div>
        </div>

        {/* 危険な操作 */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-400">危険な操作</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-700 dark:text-red-400">キャッシュをクリア</h3>
                <p className="text-xs text-red-600 dark:text-red-500">アプリケーションのキャッシュを削除します</p>
              </div>
              <button className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors">
                キャッシュクリア
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-700 dark:text-red-400">データベースの最適化</h3>
                <p className="text-xs text-red-600 dark:text-red-500">データベースのパフォーマンスを最適化します</p>
              </div>
              <button className="px-4 py-2 bg-yellow-500 dark:bg-yellow-600 text-white rounded-md hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors">
                最適化実行
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
