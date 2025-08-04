/**
 * テーマ対応ボタンコンポーネント
 */

'use client';

import React from 'react';
import { ButtonLoading } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly loading?: boolean;
  readonly icon?: React.ReactNode;
  readonly iconPosition?: 'left' | 'right';
  readonly fullWidth?: boolean;
}

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

  const combinedClasses = [
    baseClasses,
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ButtonLoading size={size === 'sm' ? 'sm' : 'md'} />
          {children && <span className="ml-2">{children}</span>}
        </>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          <span className="mr-2">{icon}</span>
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          {children}
          <span className="ml-2">{icon}</span>
        </>
      );
    }

    return children;
  };

  return (
    <button
      className={combinedClasses}
      disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
}

/**
 * アイコンボタン
 */
export function IconButton({
  size = 'md',
  variant = 'ghost',
  className = '',
  children,
  ...props
}: Pick<ButtonProps, 'size' | 'variant' | 'className' | 'children' | 'loading' | 'disabled' | 'onClick' | 'type' | 'fullWidth'> & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const iconSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <Button
      variant={variant}
      className={`${iconSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * リンクスタイルのボタン
 */
export function LinkButton({
  className = '',
  ...props
}: ButtonProps) {
  return (
    <Button
      variant="ghost"
      className={`p-0 h-auto font-normal underline-offset-4 hover:underline ${className}`}
      {...props}
    />
  );
}
