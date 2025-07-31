import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  createSuccessResponse, 
  createErrorResponse, 
  validateData,
  handleApiError
} from '@/app/lib/api-utils';
import { ApiKeyManager } from '@/app/lib/api-keys-manager';
import { apiKeyCreateSchema } from '@/app/lib/validation-schemas';
import { 
  ApiKeyCreateRequest, 
  ApiKeysListResponse, 
  ApiErrorCode
} from '@/app/lib/api-types';

// APIキー一覧を取得（GET）
export const GET = withAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  console.log('APIキー取得API呼び出し - ユーザー:', user.username);
  
  try {
    // ユーザーのAPIキーを取得
    const apiKey = await ApiKeyManager.getUserApiKey(user.userId);
    
    if (!apiKey) {
      const response: ApiKeysListResponse = {
        apiKeys: [],
        hasApiKey: false,
        message: 'APIキーが作成されていません'
      };
      
      return createSuccessResponse(response);
    }

    // セキュリティのため、キーの一部のみ表示
    const maskedKey = apiKey.key.substring(0, 8) + '...' + apiKey.key.substring(apiKey.key.length - 4);
    
    const responseApiKey = {
      ...apiKey,
      key: maskedKey
    };

    const response: ApiKeysListResponse = {
      apiKeys: [responseApiKey],
      hasApiKey: true
    };

    return createSuccessResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
});

// 新しいAPIキーを作成（POST）
export const POST = withAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  console.log('APIキー作成API呼び出し - ユーザー:', user.username);
  
  try {
    const body: ApiKeyCreateRequest = await request.json();
    console.log('受信したデータ:', body);

    // バリデーション
    const validation = validateData(body as unknown as Record<string, unknown>, apiKeyCreateSchema);
    if (!validation.isValid) {
      return createErrorResponse(
        validation.errors.map(e => e.message).join(', '),
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }
    
    const { name, permissions, expiresAt } = body;

    // 新しいAPIキーを生成（既存のキーは自動的に無効化される）
    const newApiKey = await ApiKeyManager.generateApiKey(user.userId, {
      name: name.trim(),
      permissions: permissions || ApiKeyManager.getDefaultPermissions(user.role),
      expiresAt: expiresAt ? new Date(expiresAt as unknown as string) : undefined
    });
    
    console.log('新しいAPIキー作成成功:', newApiKey.id);
    
    const response: ApiKeysListResponse = {
      apiKeys: [newApiKey],
      hasApiKey: true
    };
    
    return createSuccessResponse(response, 'APIキーが正常に作成されました');
  } catch (error) {
    return handleApiError(error);
  }
});

// APIキーを無効化（DELETE）
export const DELETE = withAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  console.log('APIキー削除API呼び出し - ユーザー:', user.username);
  
  try {
    // ユーザーのAPIキーを無効化
    const deactivated = await ApiKeyManager.deactivateApiKey(user.userId);
    
    if (!deactivated) {
      return createErrorResponse('無効化するAPIキーが見つかりません', 404, ApiErrorCode.NOT_FOUND);
    }

    console.log('APIキー無効化成功:', user.userId);
    
    return createSuccessResponse(
      { deactivated: true }, 
      'APIキーが正常に無効化されました'
    );
  } catch (error) {
    return handleApiError(error);
  }
});
