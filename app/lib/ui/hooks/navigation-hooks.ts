/**
 * ナビゲーション関連カスタムフック（統合版）
 * 
 * クライアントサイドで現在のパスを取得するためのカスタムフックを提供し、
 * 既存のコンポーネントとの互換性を保ちます。
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useCallback } from 'react';

/**
 * 現在のパスを取得するフック
 */
export function useCurrentPath() {
  const pathname = usePathname();
  
  const pathInfo = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    
    return {
      pathname,
      segments,
      isHome: pathname === '/',
      isAdmin: pathname.startsWith('/admin'),
      isAuth: pathname.startsWith('/auth'),
      isApi: pathname.startsWith('/api'),
      depth: segments.length
    };
  }, [pathname]);
  
  return pathInfo;
}

/**
 * ブレッドクラム生成フック
 */
export function useBreadcrumbs() {
  const pathname = usePathname();
  
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; href: string; isActive?: boolean }> = [
      { label: 'Home', href: '/' }
    ];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      // セグメントを読みやすい形式に変換
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      crumbs.push({
        label,
        href: currentPath,
        isActive: isLast
      });
    });
    
    return crumbs;
  }, [pathname]);
  
  return breadcrumbs;
}

/**
 * ナビゲーション制御フック
 */
export function useNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const navigate = useCallback((href: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  }, [router]);
  
  const goBack = useCallback(() => {
    router.back();
  }, [router]);
  
  const goForward = useCallback(() => {
    router.forward();
  }, [router]);
  
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);
  
  const updateSearchParams = useCallback((params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams?.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    
    const newUrl = current.toString() ? `?${current.toString()}` : '';
    router.push(newUrl);
  }, [searchParams, router]);
  
  return {
    navigate,
    goBack,
    goForward,
    refresh,
    updateSearchParams
  };
}

/**
 * ページタイトル管理フック
 */
export function usePageTitle(title?: string) {
  const pathname = usePathname();
  
  const pageTitle = useMemo(() => {
    if (title) return title;
    
    // パスからタイトルを生成
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Home';
    
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [pathname, title]);
  
  return pageTitle;
}
