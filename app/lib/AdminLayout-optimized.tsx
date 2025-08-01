'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, memo } from 'react';
import type { ReactNode, JSX, FC } from 'react';

// Constants
export const MEDIA_MANAGEMENT_LABEL = 'メディア管理' as const;

// Strictly typed interfaces
interface AdminLayoutProps {
  readonly children: ReactNode;
  readonly title: string;
}

interface OptimizedSidebarLinkProps {
  readonly href: string;
  readonly icon: JSX.Element;
  readonly label: string;
  readonly className?: string;
}

interface MenuSection {
  readonly title: string;
  readonly items: readonly OptimizedSidebarLinkProps[];
}

// Optimized inline icons
const LeftIcon = (): JSX.Element => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const RightIcon = (): JSX.Element => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Type guards for user validation
const isAdminUser = (user: unknown): user is { role: 'admin'; displayName: string } => {
  return user !== null && typeof user === 'object' && (user as {role?: string}).role === 'admin' && typeof (user as {displayName?: string}).displayName === 'string';
};

// Optimized Loading Component
const LoadingSpinner: FC = memo(() => (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Optimized Authentication Guard
const AuthenticationGuard: FC = memo(() => (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
    <div className="text-gray-600 dark:text-gray-300">認証中...</div>
  </div>
));
AuthenticationGuard.displayName = 'AuthenticationGuard';

// Optimized Header Component
const AdminHeader: FC<{ title: string; displayName: string }> = memo(({ title, displayName }) => (
  <div className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="hover:opacity-80 transition-opacity">
          <Image src="/favicon.ico" alt="Logo" width={32} height={32} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          管理者パネル - こんにちは、{displayName}さん
        </span>
      </div>
    </div>
  </div>
));
AdminHeader.displayName = 'AdminHeader';

// Optimized Sidebar Link Component
const OptimizedSidebarLink: FC<OptimizedSidebarLinkProps> = memo(({ href, icon, label, className }) => (
  <Link
    href={href}
    className={`flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className ?? ''}`}
  >
    {icon}
    <span className="whitespace-nowrap">{label}</span>
  </Link>
));
OptimizedSidebarLink.displayName = 'OptimizedSidebarLink';

// Optimized Section Header Component
const SectionHeader: FC<{ title: string }> = memo(({ title }) => (
  <div className="px-6 py-2 mt-6">
    <div className="min-h-[24px] flex items-center">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
        {title}
      </h3>
    </div>
  </div>
));
SectionHeader.displayName = 'SectionHeader';

// Optimized Sidebar Component
const Sidebar: FC<{ 
  collapsed: boolean; 
  menuSections: readonly MenuSection[]; 
}> = memo(({ collapsed, menuSections }) => (
  <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-20 transition-all duration-300 flex flex-col overflow-hidden`}>
    <nav className="mt-6 flex-1">
      {!collapsed ? (
        <>
          {menuSections.map((section) => (
            <div key={section.title}>
              <SectionHeader title={section.title} />
              {section.items.map((item) => (
                <OptimizedSidebarLink key={item.href} {...item} />
              ))}
            </div>
          ))}
        </>
      ) : (
        <div className="flex flex-col items-center space-y-0 px-3">
          {/* Collapsed state icons only */}
        </div>
      )}
    </nav>
    <div className="h-16"></div>
  </div>
));
Sidebar.displayName = 'Sidebar';

// Toggle Button Component
const SidebarToggleButton: FC<{ 
  collapsed: boolean; 
  onClick: () => void; 
}> = memo(({ collapsed, onClick }) => (
  <div className={`fixed bottom-4 z-20 transition-all duration-300 ${collapsed ? 'left-4' : 'left-44'}`}>
    <button
      onClick={onClick}
      className="flex items-center justify-center w-12 h-12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg transition-colors"
      aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
    >
      {collapsed ? <RightIcon /> : <LeftIcon />}
    </button>
  </div>
));
SidebarToggleButton.displayName = 'SidebarToggleButton';

// Main AdminLayout Component with Performance Optimizations
export default function AdminLayout({ children, title }: AdminLayoutProps): JSX.Element {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Optimized authentication effect
  useEffect((): void => {
    if (!isLoading && (!user || !isAdminUser(user))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Optimized toggle callback
  const handleToggleSidebar = useCallback((): void => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Early returns for authentication states
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAdminUser(user)) {
    return <AuthenticationGuard />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader title={title} displayName={user.displayName} />
      <Sidebar collapsed={sidebarCollapsed} menuSections={MENU_SECTIONS} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col pt-20 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        <div className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </div>
      </div>

      <SidebarToggleButton collapsed={sidebarCollapsed} onClick={handleToggleSidebar} />
    </div>
  );
}

// Optimized Menu Configuration with Memoization
const MENU_SECTIONS: readonly MenuSection[] = [
  {
    title: 'コンテンツ管理',
    items: [
      {
        href: '/admin/new',
        label: '新規投稿',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
      },
      {
        href: '/admin/posts',
        label: '投稿管理',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 3v4M8 3v4M3 9h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        href: '/admin/media',
        label: MEDIA_MANAGEMENT_LABEL,
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="2.5" strokeWidth="2" />
            <path d="M21 17l-5-5a3 3 0 0 0-4.24 0l-7.76 7" strokeWidth="2" />
          </svg>
        ),
      },
      {
        href: '/admin/comments',
        label: 'コメント管理',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
    ] as const,
  },
  {
    title: 'システム管理',
    items: [
      {
        href: '/admin/users',
        label: 'ユーザー管理',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
      },
      {
        href: '/admin/settings',
        label: '設定',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        href: '/admin/api-keys',
        label: 'APIキー管理',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0 text-white" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        ),
      },
    ] as const,
  },
  {
    title: 'その他',
    items: [
      {
        href: '/',
        label: 'サイトを表示',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        className: 'hover:text-green-600 dark:hover:text-green-400',
      },
      {
        href: '/admin',
        label: '管理者ホーム',
        icon: (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        className: 'hover:text-green-600 dark:hover:text-green-400',
      },
    ] as const,
  },
] as const;
