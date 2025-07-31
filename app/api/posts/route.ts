import { NextRequest, NextResponse } from 'next/server';
import { createPost } from '@/app/lib/posts';
import { 
  withIntegratedAuth, 
  withRateLimit, 
  createSuccessResponse, 
  createErrorResponse,
  validateData,
  parsePaginationParams,
  handleApiError
} from '@/app/lib/api-utils';
import { postCreateSchema } from '@/app/lib/validation-schemas';
import { PostCreateRequest, PostsListRequest, PostResponse, PostsListResponse } from '@/app/lib/api-types';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 投稿作成API（レート制限＋統合認証）
export const POST = withRateLimit(
  withIntegratedAuth<[]>(
    async (request: NextRequest, context): Promise<NextResponse> => {
      try {
        const body: PostCreateRequest = await request.json();
        
        // バリデーション
        const validation = validateData(body as unknown as Record<string, unknown>, postCreateSchema);
        if (!validation.isValid) {
          return createErrorResponse(
            validation.errors.map(e => e.message).join(', '),
            400
          );
        }

        const { title, content, author, slug: customSlug } = body;

        // 新しい投稿のIDを生成
        const id = Date.now().toString();
        
        let finalSlug: string;
        
        if (customSlug?.trim()) {
          // カスタムslugが提供された場合はそれを使用
          finalSlug = customSlug.trim();
        } else {
          // カスタムslugがない場合は、タイトルから自動生成
          const baseSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // 英数字とスペースのみ残す
            .replace(/\s+/g, '-') // スペースをハイフンに変換
            .replace(/-+/g, '-') // 連続するハイフンを単一に
            .replace(/(^-+)|(-+$)/g, '') // 先頭末尾のハイフンを削除
            .trim();
          
          // baseSlugが空またはタイトルに日本語が多い場合は、投稿IDベースのslugを使用
          finalSlug = baseSlug && baseSlug.length >= 3 
            ? `${baseSlug}-${id}` 
            : `post-${id}`;
        }

        const postData = {
          id,
          slug: finalSlug,
          title,
          content,
          author,
          createdAt: new Date(),
        };

        const newPost = await createPost(postData);
        
        const response: PostResponse = {
          post: newPost
        };
        
        return createSuccessResponse(response, '投稿が正常に作成されました');
      } catch (error) {
        return handleApiError(error);
      }
    },
    { resource: 'posts', action: 'create' }
  ),
  { maxRequests: 5, windowMs: 60000, message: '投稿の作成頻度が高すぎます' }
);

// 投稿一覧取得API（統合認証）
export const GET = withIntegratedAuth<[]>(
  async (request: NextRequest, context): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);
      
      const filters: PostsListRequest = {
        page,
        limit,
        search: searchParams.get('search') || undefined,
        type: (searchParams.get('type') as 'all' | 'published' | 'deleted') || 'published',
        author: searchParams.get('author') || undefined,
        sortBy: (searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'title') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
      };

      // 投稿を取得
      const { getAllPosts } = await import('@/app/lib/posts');
      const { posts, total } = await getAllPosts(filters);

      const response: PostsListResponse = {
        posts,
        total,
        filters
      };

      return createSuccessResponse(
        response.posts,
        undefined,
        {
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { resource: 'posts', action: 'read' }
);
