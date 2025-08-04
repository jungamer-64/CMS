/**
 * 条件付きメインコンテンツ
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export interface ConditionalMainProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export default function ConditionalMain({ children, className }: ConditionalMainProps) {
  const pathname = usePathname();

  // 管理者ページでは異なるレイアウト構造
  if (pathname?.startsWith('/admin')) {
    return <div className={className}>{children}</div>;
  }

  // 通常のメインコンテンツ - 背景を含む全体レイアウト
  return (
    <main className={`min-h-screen ${className ?? ''}`}>
      {children}
    </main>
  );
}
