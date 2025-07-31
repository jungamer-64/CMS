import { NextRequest } from 'next/server';
import { updateUser, getUserSessionInfo } from '@/app/lib/users';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { UserUpdateInput } from '@/app/lib/types';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const userInfo = await getUserSessionInfo(user.userId);
    if (!userInfo) {
      return createErrorResponse('ユーザー情報が見つかりません', 404);
    }

    return createSuccessResponse(userInfo);
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return createErrorResponse('プロフィール情報の取得に失敗しました', 500);
  }
});

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const updateData: UserUpdateInput = await request.json();
    
    // 役割の変更は管理者のみ許可（一般ユーザーは変更不可）
    if (updateData.role && user.role !== 'admin') {
      return createErrorResponse('権限がありません', 403);
    }

    const success = await updateUser(user.userId, updateData);
    if (!success) {
      return createErrorResponse('プロフィールの更新に失敗しました', 400);
    }

    // 更新されたユーザー情報を取得
    const updatedUserInfo = await getUserSessionInfo(user.userId);

    console.log('プロフィール更新成功 - ユーザー:', user.username);
    return createSuccessResponse(updatedUserInfo, 'プロフィールが正常に更新されました');
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'プロフィールの更新に失敗しました';
    return createErrorResponse(errorMessage, 400);
  }
});
