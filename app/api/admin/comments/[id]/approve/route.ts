import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { approveComment } from '@/app/lib/comments';

// コメントを承認（POST）
export const POST = withAuth(async (
  request: NextRequest, 
  user, 
  { params }: { params: Promise<{ id: string }> }
) => {
  console.log('コメント承認API呼び出し - ユーザー:', user.username);
  
  try {
    const { id } = await params;
    
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