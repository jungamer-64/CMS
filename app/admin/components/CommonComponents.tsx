/**
 * Admin UI Common Components
 * 管理画面で共通利用されるコンポーネント
 */

import React from 'react';

/**
 * Loading component with consistent styling
 */
export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64" aria-label="読み込み中">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
  </div>
);

/**
 * Error display component with accessibility
 */
export const ErrorMessage = ({ message }: { readonly message: string }) => (
  <div 
    className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm"
    role="alert"
    aria-live="polite"
  >
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="font-medium">エラー:</span> {message}
    </div>
  </div>
);

/**
 * Success message component
 */
export const SuccessMessage = ({ message }: { readonly message: string }) => (
  <div 
    className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl backdrop-blur-sm"
    role="alert"
    aria-live="polite"
  >
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="font-medium">成功:</span> {message}
    </div>
  </div>
);

/**
 * Modern stats card with glass morphism effect
 */
export const StatsCard = ({ title, value, variant, icon }: {
  readonly title: string;
  readonly value: number;
  readonly variant: 'primary' | 'success' | 'neutral' | 'warning';
  readonly icon?: React.ReactNode;
}) => {
  const variants = {
    primary: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 text-blue-900 dark:text-blue-100 border-blue-200/50 dark:border-blue-700/30',
    success: 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 text-green-900 dark:text-green-100 border-green-200/50 dark:border-green-700/30',
    neutral: 'from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/20 text-gray-900 dark:text-gray-100 border-gray-200/50 dark:border-gray-600/30',
    warning: 'from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 text-amber-900 dark:text-amber-100 border-amber-200/50 dark:border-amber-700/30',
  } as const;

  return (
    <div className={`bg-gradient-to-br ${variants[variant]} p-6 rounded-xl border backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium opacity-75 mb-1">{title}</h3>
          <p className="text-3xl font-bold tracking-tight">{value.toLocaleString('ja-JP')}</p>
        </div>
        {icon && (
          <div className="opacity-60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
