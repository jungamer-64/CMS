import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';

interface TestResponse {
  success: boolean;
  message: string;
  authMethod: string;
  timestamp: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
  apiKeyUserId?: string;
  permissions?: Record<string, unknown>;
  receivedData?: Record<string, unknown>;
}

// APIキー認証をテストするエンドポイント（GET）
export async function GET() {
  try {
    console.log('テストAPI GET - 認証なし');

    const response: TestResponse = {
      success: true,
      message: '認証が成功しました',
      authMethod: 'anonymous',
      timestamp: new Date().toISOString()
    };

    return createSuccessResponse(response, '認証テストが成功しました');
  } catch (error) {
    console.error('テストAPI GET エラー:', error);
    return createErrorResponse('テストAPIでエラーが発生しました', 500);
  }
}

// 認証必須のテストエンドポイント（POST）
export const POST = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  console.log('テストAPI POST - ユーザー:', user.username);

  try {
    const body = await request.json() as Record<string, unknown>;

    const response: TestResponse = {
      success: true,
      message: '認証必須エンドポイントへのアクセスが成功しました',
      authMethod: 'user',
      receivedData: body,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    return createSuccessResponse(response, '認証テストが成功しました');
  } catch (error) {
    console.error('テストAPI POST エラー:', error);
    return createErrorResponse('テストAPIでエラーが発生しました', 500);
  }
});
