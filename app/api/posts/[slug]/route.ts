import { 
  createGetHandler, 
  createPutHandler, 
  createDeleteHandler 
} from '@/app/lib/api-factory';
import { 
  createApiSuccess, 
  createApiError, 
  ApiErrorCode 
} from '@/app/lib/api-types';
import { getPostBySlug, updatePostBySlug, deletePostBySlug } from '@/app/lib/posts';
import { validationSchemas } from '@/app/lib/validation-schemas';
import type { 
  PostResponse, 
  PostUpdateRequest 
} from '@/app/lib/api-types';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 特定の投稿を取得（公開API）
export const GET = createGetHandler<PostResponse>(
  async (request, user, params) => {
    try {
      const { slug } = params || {};
      
      if (!slug) {
        return createApiError('スラッグが必要です', ApiErrorCode.VALIDATION_ERROR);
      }

      const postResult = await getPostBySlug(slug);
      
      if (!postResult.success || !postResult.data) {
        return createApiError('投稿が見つかりません', ApiErrorCode.NOT_FOUND);
      }

      return createApiSuccess(postResult.data, '投稿を取得しました');
    } catch (error) {
      console.error('投稿取得エラー:', error);
      return createApiError(
        '投稿の取得に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: false // 公開API
  }
);

// 投稿を更新（認証必須）
export const PUT = createPutHandler<PostUpdateRequest, PostResponse>(
  async (request, body, user, params) => {
    try {
      if (!user) {
        return createApiError('認証が必要です', ApiErrorCode.UNAUTHORIZED);
      }

      const { slug } = params || {};
      
      if (!slug) {
        return createApiError('スラッグが必要です', ApiErrorCode.VALIDATION_ERROR);
      }

      const { title, content, slug: newSlug, author } = body;

      // 必須フィールドの検証
      if (!title || !content || !author) {
        return createApiError('必須フィールドが不足しています', ApiErrorCode.VALIDATION_ERROR);
      }

      // 投稿を更新
      const updatedPost = await updatePostBySlug(slug, {
        title: title.trim(),
        content: content.trim(),
        slug: newSlug?.trim() || slug,
        author: author.trim()
      });

      if (!updatedPost) {
        return createApiError('投稿が見つかりません', ApiErrorCode.NOT_FOUND);
      }

      const response: PostResponse = { post: updatedPost };
      return createApiSuccess(response, '投稿が正常に更新されました');
    } catch (error) {
      console.error('投稿更新エラー:', error);
      return createApiError(
        '投稿の更新に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: true,
    validationSchema: validationSchemas.postUpdate,
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000,
      message: '投稿更新の頻度が高すぎます'
    }
  }
);

// 投稿を削除（認証必須）
export const DELETE = createDeleteHandler<{message: string}>(
  async (request, user, params) => {
    try {
      if (!user) {
        return createApiError('認証が必要です', ApiErrorCode.UNAUTHORIZED);
      }

      const { slug } = params || {};
      
      if (!slug) {
        return createApiError('スラッグが必要です', ApiErrorCode.VALIDATION_ERROR);
      }

      const deletedPost = await deletePostBySlug(slug);

      if (!deletedPost) {
        return createApiError('投稿が見つかりません', ApiErrorCode.NOT_FOUND);
      }

      return createApiSuccess({ message: '投稿が正常に削除されました' }, '投稿が正常に削除されました');
    } catch (error) {
      console.error('投稿削除エラー:', error);
      return createApiError(
        '投稿の削除に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: true,
    rateLimit: {
      maxRequests: 5,
      windowMs: 60000,
      message: '投稿削除の頻度が高すぎます'
    }
  }
);
