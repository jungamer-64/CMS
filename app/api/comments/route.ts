import { 
  createPublicApiHandler 
} from '@/app/lib/api-factory';
import { 
  createApiSuccess, 
  createApiError, 
  ApiErrorCode 
} from '@/app/lib/api-types';
import { validationSchemas } from '@/app/lib/validation-schemas-enhanced';
import { createComment } from '@/app/lib/comments';
import { getSettings } from '@/app/lib/settings';
import type { 
  CommentCreateRequest, 
  CommentResponse 
} from '@/app/lib/api-types';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// コメント投稿（公開API - 認証不要）
export const POST = createPublicApiHandler<CommentCreateRequest, CommentResponse>(
  async (request, body) => {
    try {
      console.log('コメント投稿API呼び出し');
      console.log('投稿データ:', body);

      const { authorName, authorEmail, content, postSlug } = body;

      // 設定を取得してコメント機能が有効かチェック
      const settings = await getSettings();
      
      if (!settings.allowComments) {
        return createApiError(
          'コメント機能は現在無効になっています', 
          ApiErrorCode.FORBIDDEN
        );
      }

      // データベースにコメントを保存
      const commentData = {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        content: content.trim(),
        postSlug
      };

      // 設定に基づいて承認状態を決定
      const isApproved = !settings.requireApproval;
      const newComment = await createComment(commentData, isApproved);

      console.log('コメント作成成功:', newComment);
      
      const message = isApproved 
        ? 'コメントが正常に投稿されました' 
        : 'コメントが投稿されました。管理者の承認後に表示されます';
      
      const response: CommentResponse = {
        comment: newComment
      };

      return createApiSuccess(response, message);
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      return createApiError(
        'コメントの投稿中にエラーが発生しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    validationSchema: validationSchemas.comment.create,
    rateLimit: {
      maxRequests: 3,
      windowMs: 60000,
      message: 'コメント投稿の頻度が高すぎます。しばらく待ってから再試行してください'
    }
  }
);
