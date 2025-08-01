import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { getUserSessionInfo } from '@/app/lib/users';
import type { UserSessionInfo } from '@/app/lib/types';

// 認証ユーザー情報取得API（GET）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  console.log('認証チェック - ユーザー:', user.username);

  try {
    // ユーザー情報を取得
    const userInfo: UserSessionInfo | null = await getUserSessionInfo(user.id);
    if (!userInfo) {
      return createErrorResponse('ユーザーが見つかりません', 404);
    }

    console.log('認証レスポンス:', userInfo);
    return createSuccessResponse(userInfo, 'ユーザー情報を取得しました');

  } catch (error) {
    console.error('認証確認エラー:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : '認証確認に失敗しました',
      500
    );
  }
});
