import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-utils';
import { requireAdmin, withApiAuth, type AuthContext } from '@/app/lib/auth-middleware';
import { ApiKeyManager } from '@/app/lib/auth/utils/api-key-manager';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/api-keys/[id] - APIキー削除（管理者のみ）
export const DELETE = withApiAuth(async (request: NextRequest, authContext: AuthContext, params?: Record<string, string>) => {
  const { user } = authContext;

  // 管理者権限チェック
  if (!requireAdmin(authContext)) {
    return NextResponse.json(
      createErrorResponse('管理者権限が必要です'),
      { status: 403 }
    );
  }

  const keyId = params?.id;
  if (!keyId) {
    return NextResponse.json(
      createErrorResponse('APIキーIDが必要です'),
      { status: 400 }
    );
  }

  try {
    const success = await ApiKeyManager.deleteApiKey(keyId, user.id);
    if (!success) {
      return NextResponse.json(
        createErrorResponse('APIキーが見つかりません'),
        { status: 404 }
      );
    }
    return NextResponse.json(createSuccessResponse({ message: 'APIキーが正常に削除されました' }));
  } catch (error) {
    console.error('APIキー削除エラー:', error);
    return NextResponse.json(
      createErrorResponse('APIキーの削除に失敗しました'),
      { status: 500 }
    );
  }
});
