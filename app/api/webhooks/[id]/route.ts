import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { removeWebhook } from '@/app/lib/webhooks';

// URLからIDを抽出するヘルパー関数
function extractIdFromUrl(url: string): string {
  const pathSegments = url.split('/');
  return pathSegments[pathSegments.length - 1];
}

// Webhookを削除（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const id = extractIdFromUrl(request.url);
    
    if (!id) {
      return createErrorResponse('Webhook IDが必要です', 400);
    }

    const success = removeWebhook(id);
    if (!success) {
      return createErrorResponse('Webhookが見つかりません', 404);
    }

    return createSuccessResponse(null, 'Webhookが正常に削除されました');
  } catch (error) {
    console.error('Webhook削除エラー:', error);
    return createErrorResponse('Webhookの削除中にエラーが発生しました', 500);
  }
});
