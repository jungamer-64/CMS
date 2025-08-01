import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { restorePost } from '@/app/lib/posts';

// URLからIDを抽出するヘルパー関数
function extractIdFromUrl(url: string): string {
  const pathSegments = url.split('/');
  // .../posts/{id}/restore の形式からIDを抽出
  return pathSegments[pathSegments.length - 2];
}

// 投稿を復元（PATCH）
export const PATCH = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const id = extractIdFromUrl(request.url);
    
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
