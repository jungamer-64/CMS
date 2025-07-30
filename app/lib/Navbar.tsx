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

  // ハイドレーション完了まで基本スタイルを使用
  let navClassName = 'fixed top-2 left-4 right-4 z-50 p-4 rounded-xl transition-all duration-300';
  
  if (!mounted) {
    navClassName += ' bg-gray-700 dark:bg-gray-800 shadow-lg text-white';
  } else if (isScrolled) {
    navClassName += ' bg-gray-800/90 dark:bg-gray-900/90 shadow-xl backdrop-blur-sm text-white';
  } else {
    navClassName += ' bg-gray-700/90 dark:bg-gray-800/90 shadow-lg text-white';
  }

  return (
    <nav className={navClassName}>
      <div className="container mx-auto flex justify-between items-center min-h-[3rem]">
        <div className="flex space-x-4 items-center">
          <Link href="/" className="hover:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-200">
            ホーム
          </Link>
          <Link href="/blog" className="hover:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-200">
            ブログ
          </Link>
          {user && user.role === 'admin' && (
            <Link href="/admin" className="hover:bg-red-600 dark:hover:bg-red-700 hover:text-white px-2 py-1 rounded flex items-center transition-colors duration-200">
              管理者
            </Link>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* ダークモード切り替えボタン */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
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

          {isLoading ? (
            <span>読み込み中...</span>
          ) : (
            <>
              {user ? (
                <>
                  <span className="flex items-center">こんにちは、{user.displayName}さん</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-600 hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 rounded flex items-center transition-colors duration-200"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link 
                    href="/auth/login"
                    className="bg-gray-600 hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 rounded flex items-center transition-colors duration-200"
                  >
                    ログイン
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600 px-3 py-1 rounded flex items-center transition-colors duration-200"
                  >
                    登録
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
