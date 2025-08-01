import { NextRequest } from 'next/server';
import { changePassword } from '@/app/lib/users';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { PasswordChangeInput } from '@/app/lib/types';

// 型ガード関数
function isPasswordChangeRequest(obj: unknown): obj is PasswordChangeInput {
  if (!obj || typeof obj !== 'object') return false;
  const req = obj as Record<string, unknown>;
  return typeof req.currentPassword === 'string' && 
         typeof req.newPassword === 'string' &&
         req.currentPassword.length > 0 &&
         req.newPassword.length > 0;
}

export const PUT = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  
  try {
    const body: unknown = await request.json();
    
    // 型ガードによる検証
    if (!isPasswordChangeRequest(body)) {
      return createErrorResponse('現在のパスワードと新しいパスワードは必須です', 400);
    }

    const { currentPassword, newPassword } = body;

    if (newPassword.length < 8) {
      return createErrorResponse('新しいパスワードは8文字以上で設定してください', 400);
    }

    if (currentPassword === newPassword) {
      return createErrorResponse('新しいパスワードは現在のパスワードと異なる必要があります', 400);
    }

    const success = await changePassword(user.id, currentPassword, newPassword);
    
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
