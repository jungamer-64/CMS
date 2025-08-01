'use client';

import { usePathname } from 'next/navigation';

interface ConditionalMainProps {
  readonly children: React.ReactNode;
}

export default function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();
  
  // 管理者ページと管理者専用機能では通常のヘッダーがないため、padding-topを調整
  const isAdminPage = pathname?.startsWith('/admin') || false;
  
  return (
    <main className={isAdminPage ? '' : 'pt-16'}>
      {children}
    </main>
  );
}
