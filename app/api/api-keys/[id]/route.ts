import { NextRequest } from 'next/server';
import { createDeleteHandler } from '@/app/lib/api-factory';
import { requireAdmin } from '@/app/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { ApiKeyManager } from '@/app/lib/auth/utils/api-key-manager';
import { User } from '@/app/lib/core/types';

// DELETE /api/api-keys/[id] - APIキー削除（管理者のみ）
export const DELETE = createDeleteHandler(
  async (request: NextRequest, user: User, params?: Record<string, string>) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    const keyId = params?.id;
    if (!keyId) {
      return createErrorResponse('APIキーIDが必要です');
    }
    
    try {
      const success = await ApiKeyManager.deleteApiKey(keyId, user.id);
      if (!success) {
        return createErrorResponse('APIキーが見つかりません');
      }
      return createSuccessResponse({ message: 'APIキーが正常に削除されました' });
    } catch (error) {
      console.error('APIキー削除エラー:', error);
      return createErrorResponse('APIキーの削除に失敗しました');
    }
  }
);
