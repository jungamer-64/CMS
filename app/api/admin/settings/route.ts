import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { getSettings, updateSettings, type Settings } from '@/app/lib/settings';
import { type SettingsUpdateRequest } from '@/app/lib/api-types';

// 型ガード関数
function isSettingsUpdateRequest(obj: unknown): obj is SettingsUpdateRequest {
  if (!obj || typeof obj !== 'object') return false;
  
  const settings = obj as Record<string, unknown>;
  
  // オプショナルプロパティのチェック
  const booleanFields = ['apiAccess', 'emailNotifications', 'maintenanceMode', 'allowComments', 'requireApproval'];
  for (const field of booleanFields) {
    if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
      return false;
    }
  }
  
  const stringFields = ['apiKey', 'userHomeUrl', 'adminHomeUrl'];
  for (const field of stringFields) {
    if (settings[field] !== undefined && typeof settings[field] !== 'string') {
      return false;
    }
  }
  
  if (settings.maxPostsPerPage !== undefined && 
      (typeof settings.maxPostsPerPage !== 'number' || 
       settings.maxPostsPerPage < 1 || 
       settings.maxPostsPerPage > 100)) {
    return false;
  }
  
  // URL フィールドの形式チェック
  const urlFields = ['userHomeUrl', 'adminHomeUrl'];
  for (const field of urlFields) {
    if (settings[field] !== undefined && 
        typeof settings[field] === 'string' &&
        !String(settings[field]).startsWith('/')) {
      return false;
    }
  }
  
  return true;
}

// 設定取得（GET）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  console.log('設定取得API呼び出し - ユーザー:', user.username);
  
  try {
    const settings: Settings = await getSettings();
    console.log('設定を返します:', settings);
    return createSuccessResponse({ settings });
  } catch (error) {
    console.error('設定取得エラー:', error);
    return createErrorResponse('設定の取得中にエラーが発生しました', 500);
  }
});

// 設定保存（POST）
export const POST = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  console.log('設定保存API呼び出し - ユーザー:', user.username);
  
  try {
    const requestBody: unknown = await request.json();
    console.log('受信したリクエスト:', requestBody);

    // 型ガードを使用した安全な型チェック
    if (!isSettingsUpdateRequest(requestBody)) {
      return createErrorResponse('無効な設定データです', 400);
    }

    // 設定を保存
    const updatedSettings: Settings = await updateSettings(requestBody);
    console.log('設定保存成功:', updatedSettings);
    return createSuccessResponse({ settings: updatedSettings }, '設定が正常に保存されました');
  } catch (error) {
    console.error('設定保存エラー:', error);
    if (error instanceof SyntaxError) {
      return createErrorResponse('無効なJSONデータです', 400);
    }
    return createErrorResponse('設定の保存中にエラーが発生しました', 500);
  }
});
