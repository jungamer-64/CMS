import { NextRequest } from 'next/server';
import { createGetHandler, createPutHandler } from '@/app/lib/api-factory';
import { requireAdmin } from '@/app/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { User } from '@/app/lib/core/types';

// ============================================================================
// RESTful Resource: Homepage Components (/api/homepage/components)
// ============================================================================

interface HomepageComponent {
  id: string;
  type: 'hero' | 'features' | 'about' | 'contact';
  title: string;
  content?: string;
  isActive: boolean;
  order: number;
}

// モックデータ
let mockComponents: HomepageComponent[] = [
  {
    id: 'hero',
    type: 'hero',
    title: 'Welcome to Our Website',
    content: 'This is a sample hero section',
    isActive: true,
    order: 1
  },
  {
    id: 'features',
    type: 'features',
    title: 'Features',
    content: 'Our amazing features',
    isActive: true,
    order: 2
  },
  {
    id: 'about',
    type: 'about',
    title: 'About Us',
    content: 'Learn more about our company',
    isActive: false,
    order: 3
  }
];

// GET /api/homepage/components - コンポーネント一覧取得
export const GET = createGetHandler<HomepageComponent[]>(
  async (request: NextRequest, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      return createSuccessResponse(mockComponents);
    } catch (error) {
      console.error('コンポーネント一覧取得エラー:', error);
      return createErrorResponse('コンポーネントの取得に失敗しました');
    }
  }
);

// PUT /api/homepage/components - コンポーネント更新
export const PUT = createPutHandler<HomepageComponent[], HomepageComponent[]>(
  async (request: NextRequest, body: HomepageComponent[], user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      // コンポーネント一覧を更新
      mockComponents = body;
      
      return createSuccessResponse(mockComponents);
    } catch (error) {
      console.error('コンポーネント更新エラー:', error);
      return createErrorResponse('コンポーネントの更新に失敗しました');
    }
  }
);
