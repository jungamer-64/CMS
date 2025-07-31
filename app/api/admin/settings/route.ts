import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { getSettings, updateSettings } from '@/app/lib/settings';

// 設定取得（GET）
export const GET = withAuth(async (request: NextRequest, user) => {
  console.log('設定取得API呼び出し - ユーザー:', user.username);
  
  try {
    const settings = await getSettings();
    console.log('設定を返します:', settings);
    return createSuccessResponse({ settings });
  } catch (error) {
    console.error('設定取得エラー:', error);
    return createErrorResponse('設定の取得中にエラーが発生しました', 500);
  }
});

// 設定保存（POST）
export const POST = withAuth(async (request: NextRequest, user) => {
  console.log('設定保存API呼び出し - ユーザー:', user.username);
  
  try {
    const newSettings = await request.json();
    console.log('受信した設定:', newSettings);

    // 設定の検証
    const validationError = validateSettings(newSettings);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // 設定を保存
    const updatedSettings = await updateSettings(newSettings);
    console.log('設定保存成功:', updatedSettings);
    
    return createSuccessResponse(updatedSettings, '設定が正常に保存されました');
  } catch (error) {
    console.error('設定保存エラー:', error);
    return createErrorResponse('設定の保存中にエラーが発生しました', 500);
  }
});

// 設定バリデーション関数
function validateSettings(settings: any): string | null {
  const booleanFields = ['darkMode', 'apiAccess', 'emailNotifications', 'maintenanceMode', 'allowComments', 'requireApproval'];
  
  for (const field of booleanFields) {
    if (typeof settings[field] !== 'boolean') {
      return `${field}はboolean値である必要があります`;
    }
  }

  if (typeof settings.maxPostsPerPage !== 'number' || 
      settings.maxPostsPerPage < 5 || 
      settings.maxPostsPerPage > 50) {
    return 'maxPostsPerPageは5から50の間の数値である必要があります';
  }

  return null;
}
