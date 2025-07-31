'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  disabled = false, 
  color = 'blue',
  label
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  disabled?: boolean; 
  color?: 'blue' | 'red';
  label?: string;
}) => {
  const colorClasses = {
    blue: 'peer-checked:bg-slate-600',
    red: 'peer-checked:bg-red-600'
  };

  return (
    <label 
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={label || 'Toggle switch'}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className={`w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${colorClasses[color]}`}></div>
    </label>
  );
};

const SettingCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SettingItem = ({ 
  label, 
  description, 
  children 
}: { 
  label: string; 
  description?: string; 
  children: React.ReactNode; 
}) => (
  <div className="flex items-center justify-between">
    <div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    {children}
  </div>
);

const DisplaySettings = ({ 
  settings, 
  onChange, 
  onPreview, 
  isPreviewActive 
}: { 
  settings: Settings; 
  onChange: (key: keyof Settings, value: any) => void; 
  onPreview: () => void; 
  isPreviewActive: boolean; 
}) => (
  <SettingCard title="表示設定">
    <SettingItem 
      label="ダークモード" 
      description="管理画面のテーマを暗色にします（保存後に適用）"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onPreview}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            isPreviewActive 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white'
          }`}
        >
          {isPreviewActive ? 'プレビュー中...' : 'プレビュー'}
        </button>
        <ToggleSwitch 
          checked={settings.darkMode} 
          onChange={(checked) => onChange('darkMode', checked)} 
        />
      </div>
    </SettingItem>

    <div>
      <label htmlFor="maxPostsPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        ページあたりの投稿数
      </label>
      <input
        id="maxPostsPerPage"
        type="number"
        min="5"
        max="50"
        value={settings.maxPostsPerPage}
        onChange={(e) => onChange('maxPostsPerPage', parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />
    </div>
  </SettingCard>
);

const ApiSettings = ({ 
  settings, 
  onChange 
}: { 
  settings: Settings; 
  onChange: (key: keyof Settings, value: any) => void; 
}) => (
  <SettingCard title="API設定">
    <SettingItem 
      label="APIアクセス" 
      description="外部APIからのアクセスを許可します"
    >
      <ToggleSwitch 
        checked={settings.apiAccess} 
        onChange={(checked) => onChange('apiAccess', checked)} 
      />
    </SettingItem>

    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2">
        新しいAPIキー管理システム
      </h3>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
        APIキーの作成、編集、削除、権限管理は専用ページで行えます。
      </p>
      <Link 
        href="/admin/api-keys"
        className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        APIキー管理へ
      </Link>
    </div>
  </SettingCard>
);

const SystemSettings = ({ 
  settings, 
  onChange 
}: { 
  settings: Settings; 
  onChange: (key: keyof Settings, value: any) => void; 
}) => (
  <SettingCard title="システム設定">
    <SettingItem 
      label="メンテナンスモード" 
      description="サイトを一時的に非公開にします"
    >
      <ToggleSwitch 
        checked={settings.maintenanceMode} 
        onChange={(checked) => onChange('maintenanceMode', checked)} 
        color="red"
      />
    </SettingItem>

    <SettingItem 
      label="メール通知" 
      description="新規投稿やコメントの通知を受け取ります"
    >
      <ToggleSwitch 
        checked={settings.emailNotifications} 
        onChange={(checked) => onChange('emailNotifications', checked)} 
      />
    </SettingItem>
  </SettingCard>
);

const CommentSettings = ({ 
  settings, 
  onChange 
}: { 
  settings: Settings; 
  onChange: (key: keyof Settings, value: any) => void; 
}) => (
  <SettingCard title="コメント設定">
    <SettingItem 
      label="コメント機能" 
      description="投稿へのコメントを許可します"
    >
      <ToggleSwitch 
        checked={settings.allowComments} 
        onChange={(checked) => onChange('allowComments', checked)} 
      />
    </SettingItem>

    <SettingItem 
      label="承認が必要" 
      description="コメントの公開前に管理者の承認を求めます"
    >
      <ToggleSwitch 
        checked={settings.requireApproval} 
        onChange={(checked) => onChange('requireApproval', checked)} 
        disabled={!settings.allowComments}
      />
    </SettingItem>
  </SettingCard>
);

const SystemInfo = () => (
  <SettingCard title="システム情報">
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
  </SettingCard>
);

const DangerZone = () => (
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
);

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
    if (user?.role === 'admin') {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('設定の読み込みに失敗しました');
      }
      
      const data = await response.json();
      setSettings(data);
      
      if (data.darkMode !== isDarkMode) {
        setDarkMode(data.darkMode);
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
      setMessage('設定の読み込みに失敗しました');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '設定の保存に失敗しました');
      }

      setMessage('設定が正常に保存されました');
      setMessageType('success');
      setDarkMode(settings.darkMode);
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage(error instanceof Error ? error.message : '設定の保存中にエラーが発生しました');
      setMessageType('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleInputChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePreview = () => {
    try {
      startPreview(3000);
    } catch (error) {
      console.error('プレビューエラー:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout title="設定">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="設定">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">システム設定</h1>
            <p className="text-gray-600 dark:text-gray-400">アプリケーションの動作やセキュリティの設定</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isSaving
                ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                : 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white'
            }`}
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>

        {message && <Message message={message} type={messageType} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DisplaySettings 
            settings={settings} 
            onChange={handleInputChange} 
            onPreview={handlePreview} 
            isPreviewActive={isPreviewActive} 
          />
          <ApiSettings 
            settings={settings} 
            onChange={handleInputChange} 
          />
          <SystemSettings 
            settings={settings} 
            onChange={handleInputChange} 
          />
          <CommentSettings 
            settings={settings} 
            onChange={handleInputChange} 
          />
        </div>

        <SystemInfo />
        <DangerZone />
      </div>
    </AdminLayout>
  );
}
