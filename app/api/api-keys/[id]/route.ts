import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, requireAdmin, type AuthContext } from '@/app/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { ApiKeyManager } from '@/app/lib/auth/utils/api-key-manager';

// DELETE /api/api-keys/[id] - APIキー削除（管理者のみ）
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiAuth(async (_req: NextRequest, authContext: AuthContext) => {
    const { user } = authContext;
    
    // 管理者権限チェック
    if (!requireAdmin(authContext)) {
      return NextResponse.json(
        createErrorResponse('管理者権限が必要です'),
        { status: 403 }
      );
    }
    
    const { id: keyId } = await context.params;
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
  })(request);
}
