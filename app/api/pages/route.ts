import { NextRequest } from 'next/server';
import { createGetHandler, createPutHandler, createDeleteHandler } from '@/app/lib/api-factory';
import { requireAdmin } from '@/app/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { User } from '@/app/lib/core/types';

// ============================================================================
// RESTful Resource: Pages (/api/pages) - 固定ページ管理
// ============================================================================

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'published' | 'draft' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

interface PageUpdateRequest {
  status?: 'published' | 'draft' | 'private';
  title?: string;
  content?: string;
}

// 開発用メモリストレージ
const mockPages: StaticPage[] = [
  {
    id: 'about',
    title: 'このサイトについて',
    slug: 'about',
    content: 'このサイトについての説明です。',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'privacy',
    title: 'プライバシーポリシー',
    slug: 'privacy',
    content: 'プライバシーポリシーの内容です。',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// GET /api/pages - 固定ページ一覧取得
export const GET = createGetHandler<StaticPage[]>(
  async (request: NextRequest, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      return createSuccessResponse(mockPages);
    } catch (err: unknown) {
      console.error('固定ページ一覧取得エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('固定ページの取得に失敗しました');
    }
  }
);

// PUT /api/pages - 固定ページ更新
export const PUT = createPutHandler<PageUpdateRequest, StaticPage>(
  async (request: NextRequest, body: PageUpdateRequest, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    const url = new URL(request.url);
    const pageId = url.searchParams.get('id');
    
    if (!pageId) {
      return createErrorResponse('ページIDが必要です');
    }
    
    try {
      const pageIndex = mockPages.findIndex(page => page.id === pageId);
      if (pageIndex === -1) {
        return createErrorResponse('ページが見つかりません');
      }
      
      // ページ更新
      const updatedPage = {
        ...mockPages[pageIndex],
        ...body,
        updatedAt: new Date()
      };
      
      mockPages[pageIndex] = updatedPage;
      
      return createSuccessResponse(updatedPage);
    } catch (err: unknown) {
      console.error('固定ページ更新エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('固定ページの更新に失敗しました');
    }
  }
);

// DELETE /api/pages - 固定ページ削除
export const DELETE = createDeleteHandler(
  async (request: NextRequest, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    const url = new URL(request.url);
    const pageId = url.searchParams.get('id');
    
    if (!pageId) {
      return createErrorResponse('ページIDが必要です');
    }
    
    try {
      const pageIndex = mockPages.findIndex(page => page.id === pageId);
      if (pageIndex === -1) {
        return createErrorResponse('ページが見つかりません');
      }
      
      // ページ削除
      mockPages.splice(pageIndex, 1);
      
      return createSuccessResponse({ message: 'ページが正常に削除されました' });
    } catch (err: unknown) {
      console.error('固定ページ削除エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('固定ページの削除に失敗しました');
    }
  }
);
