
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { getWebhooks, addWebhook, type Webhook } from '@/app/lib/webhooks';

// 型ガード関数
function isWebhookCreateRequest(obj: unknown): obj is { url: string; event: string; enabled?: boolean } {
  if (!obj || typeof obj !== 'object') return false;
  const req = obj as Record<string, unknown>;
  return typeof req.url === 'string' && 
         typeof req.event === 'string' &&
         req.url.trim().length > 0 &&
         req.event.trim().length > 0;
}

// Webhook一覧を取得（GET）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  
  try {
    const webhooks = getWebhooks();
    return createSuccessResponse({ webhooks }, 'Webhook一覧を取得しました');
  } catch (error) {
    console.error('Webhook取得エラー:', error);
    return createErrorResponse('Webhookの取得中にエラーが発生しました', 500);
  }
});

// 新しいWebhookを作成（POST）
export const POST = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  
  try {
    const body = await request.json();
    
    // 型ガードによる検証
    if (!isWebhookCreateRequest(body)) {
      return createErrorResponse('URLとイベントは必須です', 400);
    }

    const { url, event, enabled } = body;
    
    const webhook: Webhook = {
      id: randomUUID(),
      url: url.trim(),
      event: event.trim() as Webhook['event'],
      enabled: enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    
    addWebhook(webhook);
    
    return createSuccessResponse({ webhook }, 'Webhookが正常に作成されました');
  } catch (error) {
    console.error('Webhook作成エラー:', error);
    if (error instanceof SyntaxError) {
      return createErrorResponse('無効なJSONデータです', 400);
    }
    return createErrorResponse('Webhookの作成中にエラーが発生しました', 500);
  }
});
