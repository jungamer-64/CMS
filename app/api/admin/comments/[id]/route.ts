import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { deleteComment } from '@/app/lib/comments';

// コメントを削除（DELETE）
export const DELETE = withAuth(async (
  request: NextRequest, 
  user, 
  { params }: { params: Promise<{ id: string }> }
) => {
  console.log('コメント削除API呼び出し - ユーザー:', user.username);
  
  try {
    const { id } = await params;
    
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