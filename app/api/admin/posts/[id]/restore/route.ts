import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { restorePost } from '@/app/lib/posts';

interface RouteParams {
  params: {
    id: string;
  };
}

export const PATCH = withAuth(async (request: NextRequest, user, { params }: RouteParams) => {
  try {
    const { id } = params;
    
    if (!id) {
      return createErrorResponse('投稿IDが必要です', 400);
    }
    
    console.log(`投稿復元API - ユーザー: ${user.username}, 投稿ID: ${id}`);
    
    const result = await restorePost(id);
    
    if (!result) {
      return createErrorResponse('投稿が見つかりません', 404);
    }
    
    return createSuccessResponse({
      message: '投稿を復元しました',
      postId: id
    });
    
  } catch (error) {
    console.error('投稿復元API エラー:', error);
    return createErrorResponse('投稿の復元に失敗しました', 500);
  }
});
