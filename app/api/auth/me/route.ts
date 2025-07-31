import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserSessionInfo } from '@/app/lib/users';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    console.log('認証チェック - トークン存在:', !!token);

    if (!token) {
      console.log('認証エラー: トークンが見つかりません');
      return createErrorResponse('認証が必要です', 401);
    }

    // JWTトークンを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
      username: string;
      role: string;
    };
    console.log('トークン検証成功 - ユーザー:', decoded.username);

    // ユーザー情報を取得
    const userInfo = await getUserSessionInfo(decoded.userId);
    if (!userInfo) {
      return createErrorResponse('ユーザーが見つかりません', 404);
    }

    console.log('認証レスポンス:', userInfo);
    return createSuccessResponse(userInfo);

  } catch (error) {
    console.error('認証確認エラー:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return createErrorResponse('無効なトークンです', 401);
    }
    return createErrorResponse('認証確認に失敗しました', 500);
  }
}
