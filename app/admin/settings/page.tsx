'use client';
import { useCMSI18n } from '@/app/lib/contexts/cms-i18n-context';
import type { ApiResponse } from '@/app/lib/core/types/response-types';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import { useTheme } from '@/app/lib/ui/contexts/theme-context';
import { LoadingSpinner, SuccessMessage, ErrorMessage } from '@/app/admin/components';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

// 型定義


type Settings = Readonly<{
  apiAccess: boolean;
  apiKey: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  maxPostsPerPage: number;
  allowComments: boolean;
  requireApproval: boolean;
}>;

type ThemeState = Readonly<{
  ui: boolean;
  loaded: boolean;
}>;

type SettingKey = keyof Settings;

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'blue' | 'red';
  label?: string;
}
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled = false, color = 'blue', label }) => {
  const colorClasses = {
    blue: 'peer-checked:bg-slate-600',
    red: 'peer-checked:bg-red-600',
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







interface SettingCardProps {
  title: string;
  children: React.ReactNode;
}
const SettingCard: React.FC<SettingCardProps> = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}
const SettingItem: React.FC<SettingItemProps> = ({ label, description, children }) => (
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

interface DisplaySettingsProps {
  settings: Settings;
  onChange: (key: SettingKey, value: unknown) => void;
  darkMode: boolean;
  onDarkModeChange: (checked: boolean) => void;
}
const DisplaySettings: React.FC<DisplaySettingsProps> = ({ settings, onChange, darkMode, onDarkModeChange }) => (
  <SettingCard title="表示設定">
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
    <SettingItem
      label="ダークモード"
      description="ユーザーごとに設定されます"
    >
      <ToggleSwitch
        checked={darkMode}
        onChange={onDarkModeChange}
        label="ダークモード切替"
      />
    </SettingItem>
  </SettingCard>
);

interface ApiSettingsProps {
  settings: Settings;
  onChange: (key: SettingKey, value: unknown) => void;
}
const ApiSettings: React.FC<ApiSettingsProps> = ({ settings, onChange }) => (
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

interface SystemSettingsProps {
  settings: Settings;
  onChange: (key: SettingKey, value: unknown) => void;
}
const SystemSettings: React.FC<SystemSettingsProps> = ({ settings, onChange }) => (
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

interface CommentSettingsProps {
  settings: Settings;
  onChange: (key: SettingKey, value: unknown) => void;
}
const CommentSettings: React.FC<CommentSettingsProps> = ({ settings, onChange }) => (
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

const SystemInfo: React.FC = () => (
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

const LanguageSettings: React.FC = () => {
  const { locale, setLocale, t } = useCMSI18n();

  const languages = [
    { code: 'ja' as const, name: t('settings.languages.japanese'), nativeName: '日本語' },
    { code: 'en' as const, name: t('settings.languages.english'), nativeName: 'English' }
  ];

  const handleLanguageChange = (newLocale: 'ja' | 'en') => {
    console.log('Changing language from', locale, 'to', newLocale);
    setLocale(newLocale);
  };

  return (
    <SettingCard title={t('settings.language.title')}>
      <SettingItem
        label={t('settings.language.interface')}
        description={t('settings.language.description')}
      >
        <div className="space-y-2">
          <select
            value={locale}
            onChange={(e) => handleLanguageChange(e.target.value as 'ja' | 'en')}
            className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-gray-900 dark:text-white"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            現在の言語: {locale} | Current language: {locale}
          </p>
        </div>
      </SettingItem>
    </SettingCard>
  );
};

interface DangerZoneProps {
  onCacheClear: () => void;
  isCacheClearing: boolean;
}
const DangerZone: React.FC<DangerZoneProps> = ({ onCacheClear, isCacheClearing }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
    <h2 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-400">危険な操作</h2>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-red-700 dark:text-red-400">キャッシュをクリア</h3>
          <p className="text-xs text-red-600 dark:text-red-500">アプリケーションのキャッシュを削除します</p>
        </div>
        <button
          onClick={onCacheClear}
          disabled={isCacheClearing}
          className={`px-4 py-2 text-white rounded-md transition-colors ${isCacheClearing
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700'
            }`}
        >
          {isCacheClearing ? 'クリア中...' : 'キャッシュクリア'}
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
  const { user } = useAuth();
  const { t } = useCMSI18n();
  const { isDarkMode, setDarkMode } = useTheme();
  const [settings, setSettings] = useState<Settings>({
    apiAccess: true,
    apiKey: '',
    emailNotifications: true,
    maintenanceMode: false,
    maxPostsPerPage: 10,
    allowComments: true,
    requireApproval: false,
  });
  const [theme, setTheme] = useState<ThemeState>({ ui: false, loaded: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCacheClearing, setIsCacheClearing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  // 初回マウント時: ThemeProviderのisDarkModeをローカル状態に反映
  useLayoutEffect(() => {
    setTheme(prev => ({ ...prev, ui: isDarkMode }));
  }, [isDarkMode]);

  // DBからdarkMode取得し、ローカル状態とThemeProviderを同期
  useEffect(() => {
    if (user?.role !== 'admin' || !user?.id) return;
    fetch(`/api/users/${user.id}/theme`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: ApiResponse<{ darkMode: boolean }>) => {
        if (data.success && typeof data.data?.darkMode === 'boolean') {
          setTheme({ ui: data.data.darkMode, loaded: true });
          setDarkMode(data.data.darkMode);
        } else {
          setTheme(prev => ({ ...prev, loaded: true }));
        }
      })
      .catch((error) => {
        console.warn('ユーザーテーマ取得エラー:', error);
        setTheme(prev => ({ ...prev, loaded: true }));
      });
  }, [user?.role, user?.id, setDarkMode]);



  const loadSettings = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('設定の読み込みに失敗しました');
      const data: ApiResponse<{ settings: Settings }> = await response.json();
      if (data.success && data.data) {
        let settingsData: Settings;
        if ('settings' in data.data && data.data.settings) {
          settingsData = data.data.settings;
        } else {
          settingsData = data.data as unknown as Settings;
        }
        if (
          settingsData &&
          typeof settingsData === 'object' &&
          'apiAccess' in settingsData &&
          'apiKey' in settingsData &&
          'emailNotifications' in settingsData &&
          'maintenanceMode' in settingsData &&
          'maxPostsPerPage' in settingsData &&
          'allowComments' in settingsData &&
          'requireApproval' in settingsData
        ) {
          setSettings({
            apiAccess: Boolean(settingsData.apiAccess),
            apiKey: String(settingsData.apiKey || ''),
            emailNotifications: Boolean(settingsData.emailNotifications),
            maintenanceMode: Boolean(settingsData.maintenanceMode),
            maxPostsPerPage: Number(settingsData.maxPostsPerPage) || 10,
            allowComments: Boolean(settingsData.allowComments),
            requireApproval: Boolean(settingsData.requireApproval),
          });
        } else {
          throw new Error('設定データの形式が不正です');
        }
      } else {
        const errorMsg = !data.success && 'error' in data ? data.error : '設定の読み込みに失敗しました';
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '設定の読み込みに失敗しました';
      setErrorMessage(errorMsg);
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') loadSettings();
  }, [user?.role, loadSettings]);

  // 保存時はDBへ反映→再取得してUI同期
  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      // 設定保存
      const response = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '設定の保存に失敗しました');
      }
      // ダークモード保存
      if (!user?.id) {
        throw new Error('ユーザー情報が取得できませんでした');
      }
      const themeRes = await fetch(`/api/users/${user.id}/theme`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ darkMode: theme.ui }),
      });

      const themeData: ApiResponse<{ darkMode: boolean }> = await themeRes.json();

      if (!themeRes.ok || !themeData.success) {
        const errorMessage = 'error' in themeData ? themeData.error : 'ダークモードの保存に失敗しました';
        throw new Error(errorMessage);
      }

      // 保存後にレスポンスから値を反映
      setTheme(prev => ({ ...prev, ui: themeData.data?.darkMode ?? prev.ui }));
      setSuccessMessage('設定が正常に保存されました');
      setErrorMessage('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : '設定の保存中にエラーが発生しました');
      setSuccessMessage('');
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
    }
  }, [settings, theme.ui, user?.id]);

  // 入力変更
  const handleInputChange = useCallback((key: SettingKey, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // ダークモード切り替え
  const handleDarkModeChange = useCallback((checked: boolean) => {
    setTheme(prev => ({ ...prev, ui: checked }));
    setDarkMode(checked);
  }, [setDarkMode]);

  // キャッシュクリア
  const handleCacheClear = useCallback(async () => {
    if (!confirm('キャッシュをクリアしますか？この操作により、サイトのパフォーマンスが一時的に低下する可能性があります。')) return;
    setIsCacheClearing(true);
    try {
      const response = await fetch('/api/admin/cache', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'キャッシュクリアに失敗しました');
      }
      const data: ApiResponse<unknown> = await response.json();
      if (data.success) {
        setSuccessMessage(data.message || 'キャッシュが正常にクリアされました');
      } else {
        setSuccessMessage('キャッシュが正常にクリアされました');
      }
      setErrorMessage('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'キャッシュクリア中にエラーが発生しました');
      setSuccessMessage('');
    } finally {
      setIsCacheClearing(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
    }
  }, []);

  // テーマ状態が未確定の間はAdminLayout+LoadingSpinnerのみ描画（前のテーマ状態を維持）
  if (!theme.loaded || isLoading || !user) {
    return (
      <AdminLayout title={t('settings.title')}>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  // テーマ状態が確定したら通常描画
  return (
    <AdminLayout title={t('settings.title')}>
      <div className="h-full p-6">
        <div className="space-y-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.systemSettings')}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t('settings.systemDescription')}</p>
            </div>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg transition-colors ${isSaving
                  ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                  : 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white'
                }`}
            >
              {isSaving ? t('settings.saving') : t('settings.saveSettings')}
            </button>
          </div>

          {successMessage && <SuccessMessage message={successMessage} />}
          {errorMessage && <ErrorMessage message={errorMessage} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DisplaySettings
              settings={settings}
              onChange={handleInputChange}
              darkMode={theme.ui}
              onDarkModeChange={handleDarkModeChange}
            />
            <ApiSettings settings={settings} onChange={handleInputChange} />
            <SystemSettings settings={settings} onChange={handleInputChange} />
            <CommentSettings settings={settings} onChange={handleInputChange} />
            <LanguageSettings />
          </div>

          <SystemInfo />
          <DangerZone onCacheClear={handleCacheClear} isCacheClearing={isCacheClearing} />
        </div>
      </div>
    </AdminLayout>
  );
}
