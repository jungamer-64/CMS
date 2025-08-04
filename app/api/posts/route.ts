import { 
  createGetHandler, 
  createPostHandler 
} from '@/app/lib/api-factory';
import { 
  createApiSuccess, 
  createApiError, 
  ApiErrorCode 
} from '@/app/lib/api-types';
import { createPost } from '@/app/lib/posts';
import { validationSchemas } from '@/app/lib/validation-schemas';
import type { 
  PostCreateRequest, 
  PostsListRequest,
  PostResponse, 
  PostsListResponse
} from '@/app/lib/api-types';
import type { PostInput } from '@/app/lib/types';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 投稿一覧取得（公開API）
export const GET = createGetHandler<PostsListResponse>(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      
      // URLパラメータを型安全に解析
      const filters: PostsListRequest = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        type: searchParams.get('type') as 'all' | 'published' | 'deleted' || 'published',
        author: searchParams.get('author') || undefined,
        sortBy: searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'title' || 'createdAt',
        sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
      };

      // 投稿を取得
      const { getAllPosts } = await import('@/app/lib/posts');
      const { posts, total } = await getAllPosts(filters);

      const response: PostsListResponse = {
        posts,
        total,
        filters
      };

      return createApiSuccess(response, '投稿一覧を取得しました');
    } catch (error) {
      return createApiError(
        error instanceof Error ? error.message : '投稿一覧の取得に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: false // 公開API
  }
);

// 新規投稿作成（認証必須）
export const POST = createPostHandler<PostCreateRequest, PostResponse>(
  async (request, body, user) => {
    try {
      if (!user) {
        return createApiError('認証が必要です', ApiErrorCode.UNAUTHORIZED);
      }

      const { title, content, author, slug: customSlug, media } = body;
      
      // authorがdisplayNameの場合、usernameに変換
      let username: string = author;
      const { getUserByUsername, getAllUsersWithFilters } = await import('@/app/lib/users');
      
      // まずusernameで検索
      const userByUsername = await getUserByUsername(author);
      if (!userByUsername) {
        // usernameで見つからなければdisplayNameで全件検索
        const users = await getAllUsersWithFilters({ search: author });
        const foundUser = users.find(u => u.displayName === author);
        if (foundUser) {
          username = foundUser.username;
        }
      } else {
        username = userByUsername.username;
      }

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
        const timestamp = Date.now().toString();
        finalSlug = baseSlug && baseSlug.length >= 3 
          ? `${baseSlug}-${timestamp}` 
          : `post-${timestamp}`;
      }

      const postInput: PostInput = {
        title,
        content,
        author: username,
        slug: finalSlug,
        media: Array.isArray(media) ? media : [],
      };
      
      const newPost = await createPost(postInput);
      
      const response: PostResponse = {
        post: newPost
      };
      
      return createApiSuccess(response, '投稿が正常に作成されました');
    } catch (error) {
      return createApiError(
        error instanceof Error ? error.message : '投稿の作成に失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: true,
    validationSchema: validationSchemas.postCreate,
    rateLimit: {
      maxRequests: 5,
      windowMs: 60000,
      message: '投稿の作成頻度が高すぎます'
    }
  }
);
