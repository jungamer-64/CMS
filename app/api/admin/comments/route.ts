import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { getAllCommentsForAdmin } from '@/app/lib/comments';

// コメント一覧を取得（GET）
export const GET = withAuth(async (request: NextRequest, user) => {
  console.log('管理者コメントAPI呼び出し - ユーザー:', user.username);
  
  try {
    // データベースからすべてのコメントを取得
    const comments = await getAllCommentsForAdmin();
    
    console.log(`取得したコメント数: ${comments.length}`);
    
    return createSuccessResponse(
      { comments }, 
      'コメント一覧を正常に取得しました'
    );
  } catch (error) {
    console.error('コメント取得エラー:', error);
    return createErrorResponse('コメントの取得中にエラーが発生しました', 500);
  }
});

// コメントを更新（PUT）
export const PUT = withAuth(async (request: NextRequest, user) => {
  console.log('コメント更新API呼び出し - ユーザー:', user.username);
  
  try {
    const { commentId, isApproved } = await request.json();
    
    console.log('更新データ:', { commentId, isApproved });

    if (!commentId) {
      return createErrorResponse('コメントIDが必要です', 400);
    }

    if (typeof isApproved !== 'boolean') {
      return createErrorResponse('承認状態はboolean値である必要があります', 400);
    }

    // データベースのコメントを更新
    const { updateComment } = await import('@/app/lib/comments');
    const success = await updateComment(commentId, { isApproved });

    if (!success) {
      return createErrorResponse('コメントが見つからないか、更新に失敗しました', 404);
    }

    console.log('コメント更新成功:', { commentId, isApproved });
    
    return createSuccessResponse(
      { commentId, isApproved, updatedAt: new Date().toISOString() }, 
      'コメントが正常に更新されました'
    );
  } catch (error) {
    console.error('コメント更新エラー:', error);
    return createErrorResponse('コメントの更新中にエラーが発生しました', 500);
  }
});

// コメントを削除（DELETE）
export const DELETE = withAuth(async (request: NextRequest, user) => {
  console.log('コメント削除API呼び出し - ユーザー:', user.username);
  
  try {
    const { commentId } = await request.json();
    
    console.log('削除対象ID:', commentId);

    if (!commentId) {
      return createErrorResponse('コメントIDが必要です', 400);
    }

    // データベースからコメントを削除（論理削除）
    const { deleteComment } = await import('@/app/lib/comments');
    const success = await deleteComment(commentId);

    if (!success) {
      return createErrorResponse('コメントが見つからないか、削除に失敗しました', 404);
    }

    console.log('コメント削除成功:', commentId);
    
    return createSuccessResponse(
      { commentId }, 
      'コメントが正常に削除されました'
    );
  } catch (error) {
    console.error('コメント削除エラー:', error);
    return createErrorResponse('コメントの削除中にエラーが発生しました', 500);
  }
});
