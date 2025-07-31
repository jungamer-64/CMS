import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { updateUserDarkMode, getUserDarkMode } from '@/app/lib/users';

// ユーザーのダークモード設定を取得（GET）
export const GET = withAuth(async (request: NextRequest, user) => {
  console.log('ダークモード設定取得API呼び出し - ユーザー:', user.username);
  
  try {
    const darkMode = await getUserDarkMode(user.userId);
    console.log('取得したダークモード設定:', darkMode);
    
    return createSuccessResponse(
      { darkMode: darkMode ?? false },
      'ダークモード設定を正常に取得しました'
    );
  } catch (error) {
    console.error('ダークモード設定取得エラー:', error);
    return createErrorResponse('ダークモード設定の取得中にエラーが発生しました', 500);
  }
});

// ユーザーのダークモード設定を更新（PUT）
export const PUT = withAuth(async (request: NextRequest, user) => {
  console.log('ダークモード設定更新API呼び出し - ユーザー:', user.username);
  
  try {
    const { darkMode } = await request.json();
    
    if (typeof darkMode !== 'boolean') {
      return createErrorResponse('darkModeフィールドはboolean型である必要があります', 400);
    }
    
    console.log('新しいダークモード設定:', darkMode);
    
    const success = await updateUserDarkMode(user.userId, darkMode);
    
    if (!success) {
      return createErrorResponse('ダークモード設定の更新に失敗しました', 500);
    }
    
    console.log('ダークモード設定更新成功');
    return createSuccessResponse(
      { darkMode },
      'ダークモード設定を正常に更新しました'
    );
  } catch (error) {
    console.error('ダークモード設定更新エラー:', error);
    return createErrorResponse('ダークモード設定の更新中にエラーが発生しました', 500);
  }
});
