import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { deletePost, restorePost, permanentlyDeletePost } from '@/app/lib/posts';

// URLからIDを抽出するヘルパー関数
function extractIdFromUrl(url: string): string {
  const pathSegments = url.split('/');
  return pathSegments[pathSegments.length - 1];
}

// 型ガード関数
function isDeleteRequest(obj: unknown): obj is { permanent?: boolean } {
  if (!obj || typeof obj !== 'object') return true; // 空のオブジェクトも許可
  const req = obj as Record<string, unknown>;
  return req.permanent === undefined || typeof req.permanent === 'boolean';
}

// 投稿を削除（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const id = extractIdFromUrl(request.url);
    
    if (!id) {
      return createErrorResponse('投稿IDが必要です', 400);
    }
    
    const body = await request.json().catch(() => ({}));
    
    // 型ガードによる検証
    if (!isDeleteRequest(body)) {
      return createErrorResponse('無効なリクエストデータです', 400);
    }
    
    const permanent = body.permanent === true;
    
    console.log(`投稿削除API - ユーザー: ${user.username}, 投稿ID: ${id}, 永続削除: ${permanent}`);
    
    const result = permanent 
      ? await permanentlyDeletePost(id)
      : await deletePost(id);
    
    if (!result) {
      return createErrorResponse('投稿が見つかりません', 404);
    }
    
    return createSuccessResponse({
      message: permanent ? '投稿を完全に削除しました' : '投稿をゴミ箱に移動しました',
      postId: id,
      permanent
    });
    
  } catch (error) {
    console.error('投稿削除API エラー:', error);
    return createErrorResponse('投稿の削除に失敗しました', 500);
  }
});

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
