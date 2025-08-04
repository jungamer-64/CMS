/**
 * ナビゲーションバーコンポーネント
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { useAdvancedI18n } from '../../../contexts/advanced-i18n-context';
import { AdvancedLanguageSwitcher } from '../../../components/AdvancedLanguageSwitcher';
import ThemeToggle from '../ThemeToggle';

export interface NavbarProps {
  readonly title?: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useAdvancedI18n();

  const displayTitle = title || t('common.site.modernBlog');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span>{displayTitle}</span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link 
              href="/articles" 
              className="relative text-foreground hover:text-primary px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-accent"
            >
              {t('common.navigation.articles')}
            </Link>

            <AdvancedLanguageSwitcher 
              variant="dropdown" 
              showProgress={false}
              className="hidden md:block" 
            />

            <ThemeToggle variant="icon-only" size="md" />

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {user?.displayName || user?.username}
                  </span>
                </div>
                {user?.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="btn-primary inline-flex items-center text-sm shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('common.navigation.adminPanel')}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('common.navigation.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth/login" 
                  className="text-foreground hover:text-primary px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-accent"
                >
                  {t('common.navigation.login')}
                </Link>
                <Link 
                  href="/auth/register" 
                  className="btn-primary inline-flex items-center text-sm shadow-lg hover:shadow-xl"
                >
                  {t('common.navigation.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
