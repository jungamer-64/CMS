/**
 * エディターレイアウト
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useAdvancedI18n } from '@/app/lib/contexts/advanced-i18n-context';
import LoadingSpinner from '../../../../components/LoadingSpinner';

export interface EditorLayoutProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export default function EditorLayout({ children, className }: EditorLayoutProps) {
  const { user, isLoading } = useAuth();
  const { t } = useAdvancedI18n();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('auth.loginRequired')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('auth.pleaseLogin')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
