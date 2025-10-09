import { getOptionalString, parsePaginationParams } from '@/app/lib/api-utils';
import { handleApiError, handleSuccess } from '@/app/lib/core/error-handler';
import DatabaseManager, { getDatabase } from '@/app/lib/database/connection';
import { PostModel } from '@/app/lib/database/models/post';
import { NextRequest } from 'next/server';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// パブリック投稿一覧取得API（認証不要）
export async function GET(request: NextRequest) {
  try {
    // データベース接続を確立
    await DatabaseManager.connect();
    const db = getDatabase();

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const search = getOptionalString(searchParams, 'search');

    // PostModelインスタンスを作成
    const postModel = new PostModel(db);

    // 公開された投稿のみを取得
    const result = await postModel.findPublished({
      search,
      page,
      limit
    });

    // ホームページ用のフォーマットに変換
    const publicPosts = result.posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.authorName || '管理者',
      slug: post.slug,
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
      updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt
    }));

    return handleSuccess(publicPosts, '投稿を取得しました');

  } catch (err: unknown) {
    console.error('パブリック投稿取得エラー:', err instanceof Error ? err : String(err));
    return handleApiError(err, { location: '/api/posts/public' });
  }
}
