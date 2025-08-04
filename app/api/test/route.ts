import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth, AuthContext } from '@/app/lib/auth-middleware';

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

// APIキー認証をテストするエンドポイント (GET)
export async function GET() {
  try {
    console.log('Test API GET - No authentication');

    const response: TestResponse = {
      success: true,
      message: 'Authentication successful',
      authMethod: 'anonymous',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(createSuccessResponse(response, '認証チE��トが成功しました'));
  } catch (error) {
    console.error('チE��チEPI GET エラー:', error);
    return NextResponse.json(createErrorResponse('チE��チEPIでエラーが発生しました', 500));
  }
}

// 認証忁E���EチE��トエンド�Eイント！EOST�E�E
export const POST = withApiAuth(async (request: NextRequest, authContext: AuthContext) => {
  const user = authContext.user;
  if (!user) {
    return NextResponse.json(createErrorResponse('認証惁E��がありません', 401));
  }

  console.log('チE��チEPI POST - ユーザー:', user.username);

  try {
    const body = await request.json() as Record<string, unknown>;

    const response: TestResponse = {
      success: true,
      message: '認証忁E��エンド�Eイントへのアクセスが�E功しました',
      authMethod: 'user',
      receivedData: body,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    return NextResponse.json(createSuccessResponse(response, '認証チE��トが成功しました'));
  } catch (error) {
    console.error('チE��チEPI POST エラー:', error);
    return NextResponse.json(createErrorResponse('チE��チEPIでエラーが発生しました', 500));
  }
});
