import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { updateUserDarkMode, getUserDarkMode } from '@/app/lib/users';
import { type ThemeUpdateRequest, type ThemeResponse } from '@/app/lib/api-types';

// 型ガード関数
function isThemeUpdateRequest(obj: unknown): obj is ThemeUpdateRequest {
  if (!obj || typeof obj !== 'object') return false;
  
  const request = obj as Record<string, unknown>;
  return typeof request.darkMode === 'boolean';
}

// ユーザーのダークモード設定を取得（GET）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  console.log('ダークモード設定取得API呼び出し - ユーザー:', user.username);
  
  try {
    const darkMode = await getUserDarkMode(user.id);
    console.log('取得したダークモード設定:', darkMode);
    
    const response: ThemeResponse = { darkMode: darkMode ?? false };
    return createSuccessResponse(response, 'ダークモード設定を正常に取得しました');
  } catch (error) {
    console.error('ダークモード設定取得エラー:', error);
    return createErrorResponse('ダークモード設定の取得中にエラーが発生しました', 500);
  }
});

// ユーザーのダークモード設定を更新（PUT）
export const PUT = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  console.log('ダークモード設定更新API呼び出し - ユーザー:', user.username);
  
  try {
    const requestBody: unknown = await request.json();
    console.log('受信したリクエスト:', requestBody);

    // 型ガードを使用した安全な型チェック
    if (!isThemeUpdateRequest(requestBody)) {
      return createErrorResponse('darkModeフィールドはboolean型である必要があります', 400);
    }

    console.log('新しいダークモード設定:', requestBody.darkMode);
    
    const success = await updateUserDarkMode(user.id, requestBody.darkMode);
    
    if (!success) {
      return createErrorResponse('ダークモード設定の更新に失敗しました', 500);
    }
    
    console.log('ダークモード設定更新成功');
    const response: ThemeResponse = { darkMode: requestBody.darkMode };
    return createSuccessResponse(response, 'ダークモード設定を正常に更新しました');
  } catch (error) {
    console.error('ダークモード設定更新エラー:', error);
    if (error instanceof SyntaxError) {
      return createErrorResponse('無効なJSONデータです', 400);
    }
    return createErrorResponse('ダークモード設定の更新中にエラーが発生しました', 500);
  }
});
