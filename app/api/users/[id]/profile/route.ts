import {
  createGetHandler,
  createPutHandler
} from '@/app/lib/api-factory';
import { getUserSessionInfo, updateUser } from '@/app/lib/api/users-client';
import {
  ApiErrorCode,
  createApiError,
  createApiSuccess,
  type User,
  type UserUpdateInput
} from '@/app/lib/core/types/api-unified';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 特定ユーザーのプロフィール情報取得
export const GET = createGetHandler<User>(
  async (request, user, params) => {
    try {
      const { id } = params || {};

      if (!id) {
        return createApiError('ユーザーIDが必要です', ApiErrorCode.VALIDATION_ERROR);
      }

      // 自分自身または管理者のみアクセス可能
      if (!user || (user.id !== id && user.role !== 'admin')) {
        return createApiError('このプロフィール情報にアクセスする権限がありません', ApiErrorCode.UNAUTHORIZED);
      }

      const userInfo = await getUserSessionInfo(id);
      if (!userInfo) {
        return createApiError('ユーザー情報が見つかりません', ApiErrorCode.NOT_FOUND);
      }

      return createApiSuccess(userInfo, 'プロフィール情報を取得しました');
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      return createApiError(
        'プロフィール情報の取得に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  }
);

// 特定ユーザーのプロフィール更新
export const PUT = createPutHandler<UserUpdateInput, User>(
  async (request, body, user, params) => {
    try {
      const { id } = params || {};

      if (!id) {
        return createApiError('ユーザーIDが必要です', ApiErrorCode.VALIDATION_ERROR);
      }

      // 自分自身または管理者のみ更新可能
      if (!user || (user.id !== id && user.role !== 'admin')) {
        return createApiError('このプロフィールを更新する権限がありません', ApiErrorCode.UNAUTHORIZED);
      }

      const updateData = body;

      // 役割の変更は管理者のみ許可（一般ユーザーは変更不可）
      if (updateData.role && user.role !== 'admin') {
        return createApiError('権限がありません', ApiErrorCode.FORBIDDEN);
      }

      const success = await updateUser(id, updateData);
      if (!success) {
        return createApiError(
          'プロフィールの更新に失敗しました',
          ApiErrorCode.VALIDATION_ERROR
        );
      }

      // 更新されたユーザー情報を取得
      const updatedUserInfo = await getUserSessionInfo(id);
      if (!updatedUserInfo) {
        return createApiError(
          '更新されたユーザー情報の取得に失敗しました',
          ApiErrorCode.INTERNAL_ERROR
        );
      }

      console.log('プロフィール更新成功 - ユーザーID:', id);
      return createApiSuccess(updatedUserInfo, 'プロフィールが正常に更新されました');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return createApiError(
        error instanceof Error ? error.message : 'プロフィールの更新に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  undefined, // requiredFields
  {
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000,
      message: 'プロフィール更新の頻度が高すぎます'
    }
  }
);
