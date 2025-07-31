import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  parsePaginationParams,
  handleApiError
} from '@/app/lib/api-utils';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// パブリック投稿一覧取得API（認証不要）
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    
    // パブリック用は公開された記事のみ取得
    const filters = {
      page,
      limit: Math.min(limit, 10), // 最大10件まで制限
      search: searchParams.get('search') || undefined,
      type: 'published' as const, // 公開記事のみ
      author: undefined,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const
    };

    // 投稿を取得
    const { getAllPosts } = await import('@/app/lib/posts');
    const { posts, total } = await getAllPosts({
      page: filters.page,
      limit: filters.limit,
      search: filters.search
    });

    // レスポンス用にデータをフィルタリング（機密情報を除去）
    const publicPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author,
      slug: post.slug,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    return createSuccessResponse(
      publicPosts,
      undefined,
      {
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit)
        }
      }
    );
  } catch (error) {
    console.error('パブリック投稿取得エラー:', error);
    return handleApiError(error);
  }
}
