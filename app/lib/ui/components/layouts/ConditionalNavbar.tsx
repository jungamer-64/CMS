/**
 * 条件付きナビゲーションバー
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 管理者ページではナビゲーションバーを非表示
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <Navbar />;
}
