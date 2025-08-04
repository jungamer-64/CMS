import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager, { getDatabase } from '@/app/lib/database/connection';
import { PostModel } from '@/app/lib/database/models/post';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// パブリック投稿一覧取得API（認証不要）
export async function GET(request: NextRequest) {
  try {
    // データベース接続を確立
    await DatabaseManager.connect();
    const db = getDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);
    const search = searchParams.get('search') || undefined;

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

    return NextResponse.json({
      success: true,
      data: publicPosts
    });

  } catch (error) {
    console.error('パブリック投稿取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '投稿取得に失敗しました' },
      { status: 500 }
    );
  }
}
