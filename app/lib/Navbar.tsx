'use client';

import Link from 'next/link';
import { useAuth } from './auth';
import { useTheme } from './ThemeContext';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // モダンなナビゲーションスタイル
  let navClassName = 'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-slate-200/10 dark:border-slate-700/50';
  
  if (!mounted) {
    navClassName += ' bg-white/80 dark:bg-slate-900/80 backdrop-blur-md';
  } else if (isScrolled) {
    navClassName += ' bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-lg';
  } else {
    navClassName += ' bg-white/80 dark:bg-slate-900/80 backdrop-blur-md';
  }

  const navigationItems = [
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/articles', label: 'ブログ', icon: '📚' },
    { href: '/about', label: 'アバウト', icon: '👨‍💻' },
  ];
console.log('Navbar user:', user);
  return (
    <nav className={navClassName}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* ロゴ・ブランド */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tech Blog
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                技術情報発信
              </div>
            </div>
          </Link>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="flex items-center space-x-2">
                  <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </span>
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Link>
            ))}
            
            {user && user.role === 'admin' && (
              <>
                <Link 
                  href="/admin/media" 
                  className="group relative px-4 py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <span className="flex items-center space-x-2">
                    <span className="group-hover:scale-110 transition-transform">🖼️</span>
                    <span className="font-medium">メディア管理</span>
                  </span>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
                <Link 
                  href="/admin" 
                  className="group relative px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <span className="flex items-center space-x-2">
                    <span className="group-hover:scale-110 transition-transform">⚙️</span>
                    <span className="font-medium">管理者</span>
                  </span>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-red-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
              </>
            )}
          </div>

          {/* 右側のアクション */}
          <div className="flex items-center space-x-3">
            {/* ダークモード切り替え */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all duration-300 hover:scale-105"
              aria-label="テーマを切り替え"
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

            {/* ユーザー認証部分 */}
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            ) : (
              <>
                {user ? (
                  <div className="flex items-center space-x-3">
                    {/* ユーザーアバター */}
                    <div className="hidden md:flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {(user.displayName && user.displayName.charAt(0)) || (user.username ? user.username.charAt(0) : '?')}
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {user.displayName || user.username || 'ユーザー'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {user.role === 'admin' ? '管理者' : 'ユーザー'}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      <span className="hidden md:inline">ログアウト</span>
                      <span className="md:hidden">📤</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link 
                      href="/auth/login"
                      className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <span className="hidden md:inline">ログイン</span>
                      <span className="md:hidden">🔑</span>
                    </Link>
                    <Link 
                      href="/auth/register"
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      <span className="hidden md:inline">登録</span>
                      <span className="md:inline">📝</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* モバイルメニューボタン */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-300"
              aria-label="メニューを開く"
            >
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              
              {user && user.role === 'admin' && (
                <>
                  <Link
                    href="/admin/media"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-lg">🖼️</span>
                    <span className="font-medium">メディア管理</span>
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-lg">⚙️</span>
                    <span className="font-medium">管理者</span>
                  </Link>
                </>
              )}
            </div>

            {user && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3 px-4 py-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {(user.displayName && user.displayName.charAt(0)) || (user.username ? user.username.charAt(0) : '?')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {user.displayName || user.username || 'ユーザー'}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {user.role === 'admin' ? '管理者' : 'ユーザー'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
