import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { getPostBySlug, updatePostBySlug, deletePostBySlug } from '@/app/lib/posts';
import type { 
  PostResponse, 
  PostUpdateRequest,
  ApiResponse 
} from '@/app/lib/api-types';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// URLからslugパラメータを安全に抽出
function extractSlugFromUrl(url: string): string {
  const pathSegments = url.split('/');
  // .../posts/{slug} の形式からslugを抽出
  return pathSegments[pathSegments.length - 1];
}

// 型ガード関数
function isApiSuccess<T>(response: ApiResponse<T>): response is { success: true; data: T } {
  return response.success === true;
}

// 特定の投稿を取得（公開API）
export async function GET(request: NextRequest) {
  try {
    const slug = extractSlugFromUrl(request.url);
    
    if (!slug) {
      return createErrorResponse('スラッグが必要です', 400);
    }

    console.log('投稿取得API - スラッグ:', slug);

    const postResult = await getPostBySlug(slug);
    
    if (!isApiSuccess(postResult)) {
      return createErrorResponse(postResult.error || '投稿が見つかりません', 404);
    }

    return createSuccessResponse(postResult.data, '投稿を取得しました');
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return createErrorResponse('投稿の取得に失敗しました', 500);
  }
}

// 投稿を更新（認証必須）
export const PUT = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const slug = extractSlugFromUrl(request.url);
    
    if (!slug) {
      return createErrorResponse('スラッグが必要です', 400);
    }

    console.log(`投稿更新API - ユーザー: ${user.username}, スラッグ: ${slug}`);

    const body = await request.json() as PostUpdateRequest;
    const { title, content, author } = body;

    // 入力データの検証
    if (!title && !content && !author) {
      return createErrorResponse('更新するデータが指定されていません', 400);
    }

    if (title && title.trim().length === 0) {
      return createErrorResponse('タイトルが空です', 400);
    }

    if (content && content.trim().length === 0) {
      return createErrorResponse('内容が空です', 400);
    }

    // 既存の投稿を取得
    const existingPostResult = await getPostBySlug(slug);
    if (!isApiSuccess(existingPostResult)) {
      return createErrorResponse('投稿が見つかりません', 404);
    }

    const existingPost = existingPostResult.data.post;

    // 権限チェック（自分の投稿または管理者のみ）
    if (existingPost.author !== user.username && user.role !== 'admin') {
      return createErrorResponse('この投稿を編集する権限がありません', 403);
    }

    // 投稿を更新
    const updatedPost = await updatePostBySlug(slug, {
      title: title?.trim(),
      content: content?.trim(),
      author: author?.trim()
    });

    if (!updatedPost) {
      return createErrorResponse('投稿の更新に失敗しました', 500);
    }

    const response: PostResponse = { post: updatedPost };
    return createSuccessResponse(response, '投稿が正常に更新されました');

  } catch (error) {
    console.error('投稿更新エラー:', error);
    return createErrorResponse('投稿の更新に失敗しました', 500);
  }
});

// 投稿を削除（認証必須）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const slug = extractSlugFromUrl(request.url);
    
    if (!slug) {
      return createErrorResponse('スラッグが必要です', 400);
    }

    console.log(`投稿削除API - ユーザー: ${user.username}, スラッグ: ${slug}`);

    // 既存の投稿を取得
    const existingPostResult = await getPostBySlug(slug);
    if (!isApiSuccess(existingPostResult)) {
      return createErrorResponse('投稿が見つかりません', 404);
    }

    const existingPost = existingPostResult.data.post;

    // 権限チェック（自分の投稿または管理者のみ）
    if (existingPost.author !== user.username && user.role !== 'admin') {
      return createErrorResponse('この投稿を削除する権限がありません', 403);
    }

    // 投稿を削除
    const deletedPost = await deletePostBySlug(slug);

    if (!deletedPost) {
      return createErrorResponse('投稿の削除に失敗しました', 500);
    }

    return createSuccessResponse(
      { message: '投稿が正常に削除されました', slug },
      '投稿が正常に削除されました'
    );

  } catch (error) {
    console.error('投稿削除エラー:', error);
    return createErrorResponse('投稿の削除に失敗しました', 500);
  }
});
