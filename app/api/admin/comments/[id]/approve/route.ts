import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { approveComment } from '@/app/lib/comments';

// URLからIDを抽出するヘルパー関数
function extractIdFromUrl(url: string): string {
  const pathSegments = url.split('/');
  // .../comments/{id}/approve の形式からIDを抽出
  return pathSegments[pathSegments.length - 2];
}

// コメントを承認（POST）
export const POST = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  console.log('コメント承認API呼び出し - ユーザー:', user.username);
  
  try {
    const id = extractIdFromUrl(request.url);
    
    if (!id) {
      return createErrorResponse('コメントIDが必要です', 400);
    }

    console.log('承認対象コメントID:', id);

    // データベースでコメントを承認
    const success = await approveComment(id);

    if (!success) {
      return createErrorResponse('コメントが見つからないか、承認に失敗しました', 404);
    }

    console.log('コメント承認成功:', id);
    
    return createSuccessResponse(
      { commentId: id, isApproved: true }, 
      'コメントが正常に承認されました'
    );
  } catch (error) {
    console.error('コメント承認エラー:', error);
    return createErrorResponse('コメントの承認中にエラーが発生しました', 500);
  }
});