/**
 * モダンなテーマ切り替えコンポーネント
 */

'use client';

import React from 'react';
import { useTheme } from '../contexts/theme-context';
import { useAdvancedI18n } from '../../contexts/advanced-i18n-context';

export interface ThemeToggleProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'button' | 'switch' | 'icon-only';
  readonly className?: string;
  readonly showLabel?: boolean;
}

export default function ThemeToggle({ 
  size = 'md', 
  variant = 'button',
  className = '',
  showLabel = false
}: ThemeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t } = useAdvancedI18n();

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'switch') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-foreground">
            {t('common.ui.toggleDarkMode')}
          </span>
        )}
        <button
          onClick={toggleDarkMode}
          className={`
            relative inline-flex ${sizeClasses[size]} items-center justify-center
            bg-secondary hover:bg-accent rounded-full
            transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            group
          `}
          aria-label={t('common.ui.toggleDarkMode')}
        >
          <div className="relative w-12 h-6 bg-muted rounded-full p-1 transition-colors duration-300">
            <div 
              className={`
                absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md
                transform transition-transform duration-300 ease-in-out
                ${isDarkMode ? 'translate-x-6 bg-slate-900' : 'translate-x-0'}
              `}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <svg className={`w-3 h-3 ${isDarkMode ? 'text-muted-foreground' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              <svg className={`w-3 h-3 ${isDarkMode ? 'text-blue-400' : 'text-muted-foreground'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <button
        onClick={toggleDarkMode}
        className={`
          ${sizeClasses[size]} rounded-xl 
          bg-secondary hover:bg-accent text-foreground
          transition-all duration-300 ease-in-out
          hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${className}
        `}
        aria-label={t('common.ui.toggleDarkMode')}
      >
        {isDarkMode ? (
          <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
          </svg>
        ) : (
          <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={toggleDarkMode}
      className={`
        inline-flex items-center space-x-2 ${sizeClasses[size]} px-4
        bg-primary text-primary-foreground rounded-xl
        hover:bg-opacity-90 transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        font-medium text-sm shadow-lg hover:shadow-xl
        ${className}
      `}
      aria-label={t('common.ui.toggleDarkMode')}
    >
      {isDarkMode ? (
        <>
          <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
          </svg>
          {showLabel && <span>{t('common.theme.light')}</span>}
        </>
      ) : (
        <>
          <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          {showLabel && <span>{t('common.theme.dark')}</span>}
        </>
      )}
    </button>
  );
}
