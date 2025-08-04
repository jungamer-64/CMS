'use client';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import { useTheme } from '@/app/lib/ui/contexts/theme-context';

export default function UserSettingsPage(): JSX.Element {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect((): void => {
    setMessage('');
    setMessageType('success');
  }, [isDarkMode]);

  const handleThemeSave = async (): Promise<void> => {
    if (!user?.id) {
      setMessage('ユーザー情報が取得できませんでした');
      setMessageType('error');
      return;
    }

    setSaving(true);
    try {
      const res: Response = await fetch(`/api/users/${user.id}/theme`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ darkMode: isDarkMode }),
      });
      const data: unknown = await res.json();
      if (
        typeof data === 'object' && data !== null &&
        'success' in data && typeof (data as {success: unknown}).success === 'boolean'
      ) {
        if ((data as { success: boolean }).success) {
          setMessage('テーマ設定を保存しました');
          setMessageType('success');
        } else {
          setMessage('保存に失敗しました');
          setMessageType('error');
        }
      } else {
        setMessage('保存に失敗しました');
        setMessageType('error');
      }
    } catch {
      setMessage('保存に失敗しました');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <AdminLayout title="ユーザー設定">
        <div className="p-8 text-center text-gray-500 dark:text-gray-300">ユーザー情報を取得中...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ユーザー設定">
      <div className="max-w-xl mx-auto mt-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ユーザー設定</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">テーマ</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ダークモード</span>
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all duration-300 hover:scale-105`}
              aria-label="テーマを切り替え"
              disabled={saving}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">（右上のトグルでも切り替え可能）</span>
          </div>
          <button
            onClick={handleThemeSave}
            disabled={saving}
            className={`mt-4 px-4 py-2 rounded-lg transition-colors ${
              saving 
                ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed' 
                : 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white'
            }`}
          >
            {saving ? '保存中...' : 'テーマ設定を保存'}
          </button>
          {message && (
            <div className={`mt-2 text-sm ${
              messageType === 'success' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}
        </div>
        {/* 今後、他のユーザー個人設定もここに追加可能 */}
      </div>
    </AdminLayout>
  );
}
