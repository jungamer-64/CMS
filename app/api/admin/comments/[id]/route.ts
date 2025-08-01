import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { deleteComment } from '@/app/lib/comments';

// URLからIDを抽出するヘルパー関数
function extractIdFromUrl(url: string): string {
  const pathSegments = url.split('/');
  return pathSegments[pathSegments.length - 1];
}

// コメントを削除（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  console.log('コメント削除API呼び出し - ユーザー:', user.username);
  
  try {
    const id = extractIdFromUrl(request.url);
    
    if (!id) {
      return createErrorResponse('コメントIDが必要です', 400);
    }

    console.log('削除対象コメントID:', id);

    // データベースからコメントを削除（論理削除）
    const success = await deleteComment(id);

    if (!success) {
      return createErrorResponse('コメントが見つからないか、削除に失敗しました', 404);
    }

    console.log('コメント削除成功:', id);
    
    return createSuccessResponse(
      { commentId: id }, 
      'コメントが正常に削除されました'
    );
  } catch (error) {
    console.error('コメント削除エラー:', error);
    return createErrorResponse('コメントの削除中にエラーが発生しました', 500);
  }
});