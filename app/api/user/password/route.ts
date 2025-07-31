import { NextRequest } from 'next/server';
import { changePassword } from '@/app/lib/users';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { PasswordChangeInput } from '@/app/lib/types';

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const { currentPassword, newPassword }: PasswordChangeInput = await request.json();

    if (!currentPassword || !newPassword) {
      return createErrorResponse('現在のパスワードと新しいパスワードは必須です', 400);
    }

    if (newPassword.length < 8) {
      return createErrorResponse('新しいパスワードは8文字以上で設定してください', 400);
    }

    if (currentPassword === newPassword) {
      return createErrorResponse('新しいパスワードは現在のパスワードと異なる必要があります', 400);
    }

    const success = await changePassword(user.userId, currentPassword, newPassword);
    
    if (!success) {
      return createErrorResponse('パスワードの変更に失敗しました', 500);
    }

    console.log('パスワード変更成功 - ユーザー:', user.username);
    return createSuccessResponse(null, 'パスワードが正常に変更されました');
  } catch (error) {
    console.error('パスワード変更エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'パスワードの変更に失敗しました';
    return createErrorResponse(errorMessage, 400);
  }
});
