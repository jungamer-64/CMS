'use client';

import { CMSI18nProvider, useCMSI18n } from '@/app/lib/contexts/cms-i18n-context';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Floating Menu Component - 右下にフローティングメニュー
function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, locale, setLocale } = useCMSI18n();
  const router = useRouter();

  const navigationItems = [
    { href: '/admin', label: t('admin.navigation.dashboard'), icon: '📊' },
    { href: '/admin/posts/new', label: '新規投稿', icon: '✏️' },
    { href: '/admin/posts', label: t('admin.navigation.posts'), icon: '📝' },
    { href: '/admin/pages', label: t('admin.navigation.pages'), icon: '📄' },
    { href: '/admin/comments', label: t('admin.navigation.comments'), icon: '💬' },
    { href: '/admin/users', label: t('admin.navigation.users'), icon: '👥' },
    { href: '/admin/media', label: t('admin.navigation.media'), icon: '🖼️' },
    { href: '/admin/settings', label: t('admin.navigation.settings'), icon: '⚙️' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/auth/login');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* メインメニューボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-600 hover:bg-slate-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mb-4"
      >
        <svg
          className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* フローティングメニュー */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-60 animate-fade-in-up">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">CMS Admin</h3>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'ja' | 'en')}
              className="mt-2 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-sm border-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* ナビゲーションアイテム */}
          <div className="p-2">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </div>

          {/* フッター */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mb-1"
            >
              <span className="text-lg">🌐</span>
              <span className="text-sm font-medium">サイトを表示</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full text-left"
            >
              <span className="text-lg">🚪</span>
              <span className="text-sm font-medium">{t('admin:navigation.logout')}</span>
            </button>
          </div>
        </div>
      )}

      {/* オーバーレイ */}
      {isOpen && (
        <button
          className="fixed inset-0 bg-black/20 -z-10 cursor-default"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          aria-label="メニューを閉じる"
        />
      )}
    </div>
  );
}

// Admin Layout Component (without Provider)
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // 認証チェック
    const checkAuth = async () => {
      try {
        // 認証コンテキストの読み込みが完了するまで待機
        if (authLoading) {
          return;
        }

        // ユーザーが存在し、管理者権限を持っているかチェック
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // 管理者権限チェック（実際のユーザー権限に応じて調整）
        if (user.role !== 'admin') {
          router.push('/'); // 管理者でない場合はホームページにリダイレクト
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Authentication check failed:', error);
        }
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, user, authLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // リダイレクト中
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <FloatingMenu />
    </div>
  );
}

// Main Layout Component with Provider
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CMSI18nProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </CMSI18nProvider>
  );
}
