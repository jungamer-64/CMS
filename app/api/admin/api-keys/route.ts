import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError
} from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { ApiKeyManager } from '@/app/lib/api-keys-manager';
import type { AuthContext } from '@/app/lib/auth-middleware';
import { 
  ApiKeyCreateRequest, 
  ApiErrorCode
} from '@/app/lib/api-types';

// 型ガード関数
function isApiKeyCreateRequest(obj: unknown): obj is ApiKeyCreateRequest {
  if (!obj || typeof obj !== 'object') return false;
  const req = obj as Record<string, unknown>;
  return typeof req.name === 'string' && req.name.trim().length > 0;
}

// APIキー一覧を取得（GET）
export const GET = withApiAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証ユーザーが見つかりません', 401);
  }
  
  try {
    console.log('API GET user:', user?.id, user);
    
    // 複数APIキーを取得（なければ空配列）
    const apiKeys = await ApiKeyManager.getApiKeysForUser(user.id);
    console.log('API GET apiKeys:', apiKeys);
    
    const responseApiKeys = apiKeys.map((apiKey: import('@/app/lib/types').ApiKey) => ({
      ...apiKey,
      keyPrefix: typeof apiKey.key === 'string' ? apiKey.key.substring(0, 8) : '',
    }));
    
    return createSuccessResponse({ apiKeys: responseApiKeys });
  } catch (error) {
    return handleApiError(error);
  }
}, { resource: 'users', action: 'read' });

// 新しいAPIキーを作成（POST）
export const POST = withApiAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証ユーザーが見つかりません', 401);
  }
  
  try {
    const body: unknown = await request.json();
    console.log('受信したデータ:', body);

    // 型ガードによるバリデーション
    if (!isApiKeyCreateRequest(body)) {
      return createErrorResponse('無効なリクエストデータです', 400, ApiErrorCode.VALIDATION_ERROR);
    }
    
    const { name, permissions, expiresAt } = body;

    // 新しいAPIキーを生成（既存のキーは自動的に無効化される）
    const newApiKey = await ApiKeyManager.generateApiKey(user.id, {
      name: name.trim(),
      permissions: permissions || ApiKeyManager.getDefaultPermissions(user.role as 'user' | 'admin'),
      expiresAt: expiresAt ? new Date(expiresAt as unknown as string) : undefined
    });
    
    console.log('新しいAPIキー作成成功:', newApiKey.id);
    
    // 作成時のみキー文字列だけ返す
    return createSuccessResponse({ apiKey: newApiKey.key }, 'APIキーが正常に作成されました');
  } catch (error) {
    return handleApiError(error);
  }
}, { resource: 'users', action: 'create' });

// APIキーを無効化（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証ユーザーが見つかりません', 401);
  }
  
  try {
    // ユーザーのAPIキーを無効化
    const deactivated = await ApiKeyManager.deactivateApiKey(user.id);
    if (!deactivated) {
      return createErrorResponse('無効化するAPIキーが見つかりません', 404, ApiErrorCode.NOT_FOUND);
    }
    
    console.log('APIキー無効化成功:', user.id);
    
    return createSuccessResponse(
      { deactivated: true }, 
      'APIキーが正常に無効化されました'
    );
  } catch (error) {
    return handleApiError(error);
  }
}, { resource: 'users', action: 'delete' });
