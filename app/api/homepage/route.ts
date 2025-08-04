import { NextRequest } from 'next/server';
import { createGetHandler, createPutHandler } from '@/app/lib/api-factory';
import { requireAdmin } from '@/app/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { User } from '@/app/lib/core/types';

// ============================================================================
// RESTful Resource: Homepage (/api/homepage) - ホームページ設定
// ============================================================================

interface HomepageComponent {
  id: string;
  type: 'hero' | 'features' | 'about' | 'contact';
  title: string;
  content?: string;
  isActive: boolean;
  order: number;
}

interface HomepageSettings {
  components: HomepageComponent[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
}

// モックデータ
let mockHomepageSettings: HomepageSettings = {
  components: [
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
    }
  ],
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    backgroundColor: '#ffffff'
  }
};

// GET /api/homepage - ホームページ設定取得
export const GET = createGetHandler<HomepageSettings>(
  async (request: NextRequest, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      return createSuccessResponse(mockHomepageSettings);
    } catch (error) {
      console.error('ホームページ設定取得エラー:', error);
      return createErrorResponse('ホームページ設定の取得に失敗しました');
    }
  }
);

// PUT /api/homepage - ホームページ設定更新
export const PUT = createPutHandler<Partial<HomepageSettings>, HomepageSettings>(
  async (request: NextRequest, body: Partial<HomepageSettings>, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      // 設定を更新
      mockHomepageSettings = {
        ...mockHomepageSettings,
        ...body
      };
      
      return createSuccessResponse(mockHomepageSettings);
    } catch (error) {
      console.error('ホームページ設定更新エラー:', error);
      return createErrorResponse('ホームページ設定の更新に失敗しました');
    }
  }
);
