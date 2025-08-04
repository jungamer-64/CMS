/**
 * テーマ対応ローディングコンポーネント
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React from 'react';

export interface LoadingSpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly variant?: 'dots' | 'spinner' | 'bars' | 'pulse';
  readonly color?: 'primary' | 'secondary' | 'muted';
  readonly className?: string;
  readonly message?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  muted: 'text-muted-foreground'
};

export default function LoadingSpinner({ 
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  className = '',
  message
}: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`
                ${sizeClasses[size]} ${colorClasses[color]} rounded-full bg-current
                animate-bounce
              `}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`
                w-1 bg-current ${colorClasses[color]}
                animate-pulse
              `}
              style={{ 
                height: `${12 + (i % 3) * 4}px`,
                animationDelay: `${i * 0.1}s` 
              }}
            />
          ))}
        </div>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center space-y-3 ${className}`}>
        <div 
          className={`
            ${sizeClasses[size]} ${colorClasses[color]} rounded-full
            bg-current animate-pulse
          `}
        />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} ${colorClasses[color]}
          animate-spin rounded-full border-2 border-current border-t-transparent
        `}
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

/**
 * ページ全体を覆うローディング画面
 */
export function FullPageLoading({ message = '読み込み中...' }: { readonly message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
        <LoadingSpinner size="lg" variant="spinner" message={message} />
      </div>
    </div>
  );
}

/**
 * コンテンツエリア用のローディング
 */
export function ContentLoading({ message = '読み込み中...' }: { readonly message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" variant="dots" color="muted" message={message} />
    </div>
  );
}

/**
 * ボタン内で使用する小さなローディング
 */
export function ButtonLoading({ size = 'sm' }: { readonly size?: 'sm' | 'md' }) {
  return (
    <LoadingSpinner 
      size={size} 
      variant="spinner" 
      color="primary" 
      className="text-current" 
    />
  );
}
