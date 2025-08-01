import { 
  createGetHandler, 
  createPutHandler 
} from '@/app/lib/api-factory';
import { 
  createApiSuccess, 
  createApiError, 
  ApiErrorCode 
} from '@/app/lib/api-types';
import { updateUser, getUserSessionInfo } from '@/app/lib/users';
import { validationSchemas } from '@/app/lib/validation-schemas-enhanced';
import type { UserUpdateInput, UserResponse } from '@/app/lib/types';

// プロフィール情報取得（認証必須）
export const GET = createGetHandler<UserResponse>(
  async (request, user) => {
    try {
      if (!user) {
        return createApiError('認証が必要です', ApiErrorCode.UNAUTHORIZED);
      }

      const userInfo = await getUserSessionInfo(user.id);
      if (!userInfo) {
        return createApiError('ユーザー情報が見つかりません', ApiErrorCode.NOT_FOUND);
      }

      return createApiSuccess({ user: userInfo }, 'プロフィール情報を取得しました');
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      return createApiError(
        'プロフィール情報の取得に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: true
  }
);

// プロフィール更新（認証必須）
export const PUT = createPutHandler<UserUpdateInput, UserResponse>(
  async (request, body, user) => {
    try {
      if (!user) {
        return createApiError('認証が必要です', ApiErrorCode.UNAUTHORIZED);
      }

      const updateData = body;
      
      // 役割の変更は管理者のみ許可（一般ユーザーは変更不可）
      if (updateData.role && user.role !== 'admin') {
        return createApiError('権限がありません', ApiErrorCode.FORBIDDEN);
      }

      const success = await updateUser(user.id, updateData);
      if (!success) {
        return createApiError(
          'プロフィールの更新に失敗しました',
          ApiErrorCode.VALIDATION_ERROR
        );
      }

      // 更新されたユーザー情報を取得
      const updatedUserInfo = await getUserSessionInfo(user.id);
      if (!updatedUserInfo) {
        return createApiError(
          '更新されたユーザー情報の取得に失敗しました',
          ApiErrorCode.INTERNAL_ERROR
        );
      }

      console.log('プロフィール更新成功 - ユーザー:', user.username);
      return createApiSuccess({ user: updatedUserInfo }, 'プロフィールが正常に更新されました');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return createApiError(
        error instanceof Error ? error.message : 'プロフィールの更新に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: true,
    validationSchema: validationSchemas.user.update,
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000,
      message: 'プロフィール更新の頻度が高すぎます'
    }
  }
);
