'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // 管理者ページと管理者専用機能では通常のヘッダーを表示しない
  const isAdminPage = pathname.startsWith('/admin');
  
  if (isAdminPage) {
    return null;
  }
  
  return <Navbar />;
}
