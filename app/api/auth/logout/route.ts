import { createPostHandler } from '@/app/lib/api-factory';
import { 
  createApiSuccess, 
  createApiError, 
  ApiErrorCode 
} from '@/app/lib/api-types';

// ログアウトAPI
export const POST = createPostHandler<Record<string, never>, { message: string }>(
  async () => {
    try {
      // ログアウトは常に成功（クライアント側でトークンを削除）
      return createApiSuccess(
        { message: 'ログアウトしました' }, 
        'ログアウトしました'
      );
    } catch (error) {
      console.error('ログアウトエラー:', error);
      return createApiError(
        'ログアウトに失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: false
  }
);
