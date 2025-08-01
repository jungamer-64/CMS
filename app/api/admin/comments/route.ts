import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse
} from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { getAllCommentsForAdmin, updateComment, deleteComment } from '@/app/lib/comments';
import {
  AdminCommentUpdateRequest,
  AdminCommentDeleteRequest
} from '@/app/lib/api-types';

// Type guard functions
function isAdminCommentUpdateRequest(data: unknown): data is AdminCommentUpdateRequest {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.commentId === 'string' && 
         typeof obj.isApproved === 'boolean';
}

function isAdminCommentDeleteRequest(data: unknown): data is AdminCommentDeleteRequest {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.commentId === 'string';
}

// コメント一覧を取得（GET）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
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
export const PUT = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  console.log('コメント更新API呼び出し - ユーザー:', user.username);
  
  try {
    const body = await request.json();
    
    // 型ガードによる検証
    if (!isAdminCommentUpdateRequest(body)) {
      return createErrorResponse('無効なリクエストデータ形式です', 400);
    }

    const { commentId, isApproved } = body;
    console.log('更新データ:', { commentId, isApproved });

    // データベースのコメントを更新
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
    if (error instanceof SyntaxError) {
      return createErrorResponse('無効なJSONデータです', 400);
    }
    return createErrorResponse('コメントの更新中にエラーが発生しました', 500);
  }
});

// コメントを削除（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  console.log('コメント削除API呼び出し - ユーザー:', user.username);
  
  try {
    const body = await request.json();
    
    // 型ガードによる検証
    if (!isAdminCommentDeleteRequest(body)) {
      return createErrorResponse('無効なリクエストデータ形式です', 400);
    }

    const { commentId } = body;
    console.log('削除対象ID:', commentId);

    // データベースからコメントを削除（論理削除）
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
    if (error instanceof SyntaxError) {
      return createErrorResponse('無効なJSONデータです', 400);
    }
    return createErrorResponse('コメントの削除中にエラーが発生しました', 500);
  }
});
