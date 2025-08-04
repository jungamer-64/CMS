import { NextRequest } from 'next/server';
import { postRepository, type PostFilters } from '@/app/lib/data/repositories/post-repository';
import type { PostEntity, PostInput } from '@/app/lib/core/types/entity-types';
import { isApiSuccess } from '@/app/lib/core/utils/type-guards';
import {
  createRestDataResponse,
  createRestListResponse,
  createRestErrorResponse,
  requireAdminAuthorization,
  parseRestRequestBody,
  parseRestQueryParams,
  checkAllowedMethods,
  HttpStatus,
  RestErrorCode,
} from '@/app/lib/api/utils/rest-helpers';

// ============================================================================
// RESTful Resource: Posts (/api/posts)
// ============================================================================

/** 許可されたHTTPメソッド */
const ALLOWED_METHODS = ['GET', 'POST'] as const;

// ============================================================================
// 厳格な型定義 - RESTful Schema
// ============================================================================

/** 投稿作成リクエストスキーマ */
interface PostCreateRequestSchema {
  readonly title: string;
  readonly content: string;
  readonly excerpt?: string;
  readonly status?: 'draft' | 'published';
  readonly tags?: readonly string[];
  readonly metadata?: {
    readonly author_note?: string;
    readonly category?: string;
    readonly featured?: boolean;
  };
}

/** 投稿リソース表現 */
interface PostResource {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly excerpt?: string;
  readonly status: 'draft' | 'published';
  readonly slug: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _links: {
    readonly self: string;
    readonly author: string;
    readonly edit?: string;
    readonly delete?: string;
  };
}

// ============================================================================
// RESTful バリデーション関数
// ============================================================================

/**
 * 投稿作成リクエストの厳格な型ガード
 */
function isValidPostCreateRequest(data: unknown): data is PostCreateRequestSchema {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  
  // 必須フィールドの検証
  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    return false;
  }
  
  if (typeof obj.content !== 'string' || obj.content.trim().length === 0) {
    return false;
  }
  
  // オプショナルフィールドの検証
  if (obj.excerpt !== undefined && typeof obj.excerpt !== 'string') {
    return false;
  }
  
  if (obj.status !== undefined && !['draft', 'published'].includes(obj.status as string)) {
    return false;
  }
  
  if (obj.tags !== undefined && !Array.isArray(obj.tags)) {
    return false;
  }
  
  // メタデータの検証
  if (obj.metadata !== undefined) {
    if (typeof obj.metadata !== 'object' || obj.metadata === null) {
      return false;
    }
  }
  
  return true;
}

/**
 * RESTful スラッグ生成（URL安全）
 */
function generateRestSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // 濁点などを除去
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .substring(0, 100);
}

/**
 * エンティティをRESTリソースに変換
 */
function transformToPostResource(post: PostEntity, baseUrl: string): PostResource {
  return {
    id: post._id?.toString() || post.id,
    title: post.title,
    content: post.content,
    excerpt: undefined, // Post型にはexcerptがないため
    status: 'published', // Post型にはstatusがないため、公開として扱う
    slug: post.slug,
    author: post.author,
    tags: [], // Post型にはtagsがないため空配列
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt?.toISOString() || post.createdAt.toISOString(),
    _links: {
      self: `${baseUrl}/api/posts/${post._id || post.id}`,
      author: `${baseUrl}/api/users?search=${encodeURIComponent(post.author)}`,
      edit: `${baseUrl}/api/posts/${post._id || post.id}`,
      delete: `${baseUrl}/api/posts/${post._id || post.id}`,
    },
  } as const;
}

// ============================================================================
// RESTful API エンドポイント
// ============================================================================

/** 動的レンダリング強制 */
export const dynamic = 'force-dynamic';

/**
 * GET /api/posts - 投稿コレクション取得
 * 
 * Query Parameters:
 * - page: ページ番号 (default: 1)
 * - limit: 1ページあたりの件数 (default: 10, max: 100)
 * - search: 検索クエリ
 * - sort_by: ソートフィールド (createdAt, updatedAt, title)
 * - sort_order: ソート順 (asc, desc)
 * - status: ステータスフィルタ (draft, published)
 * - author: 著者フィルタ
 * - admin: 管理者ビュー (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    // メソッド許可チェック
    const methodError = checkAllowedMethods(request.method, ALLOWED_METHODS);
    if (methodError) return methodError;

    const { searchParams, origin } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === 'true';
    
    // 管理者ビューの認可チェック
    if (isAdminRequest) {
      const adminUser = await requireAdminAuthorization();
      if (adminUser instanceof Response) {
        return adminUser;
      }
    }

    // RESTful クエリパラメータ解析
    const { pagination, search, sorting, filters } = parseRestQueryParams(searchParams);

    // PostFilters構築（型安全）
    const postFilters: PostFilters = {
      search,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: 'createdAt',
      sortOrder: sorting.sortOrder,
      author: filters.author as string | undefined,
    } as const;

    // データベース検索実行
    const result = await postRepository.findAll(postFilters);

    if (!isApiSuccess(result)) {
      return createRestErrorResponse(
        RestErrorCode.INTERNAL_ERROR,
        'Failed to retrieve posts from the database.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // RESTリソースに変換
    const postResources = result.data.data.map(post => 
      transformToPostResource(post, origin)
    );

    // RESTful リストレスポンス生成
    return createRestListResponse(
      postResources,
      {
        page: result.data.pagination.page,
        limit: result.data.pagination.limit,
        total: result.data.pagination.total,
      },
      `Retrieved ${postResources.length} posts successfully.`,
      { search, status: filters.status, author: filters.author }
    );

  } catch (error) {
    console.error('[GET /api/posts] Internal error:', error);
    return createRestErrorResponse(
      RestErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred while processing the request.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/posts - 新規投稿作成
 * 
 * Request Body (JSON):
 * {
 *   "title": "string (required)",
 *   "content": "string (required)", 
 *   "excerpt": "string (optional)",
 *   "status": "draft|published (optional, default: draft)",
 *   "tags": "string[] (optional)",
 *   "metadata": {
 *     "author_note": "string (optional)",
 *     "category": "string (optional)",
 *     "featured": "boolean (optional)"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // メソッド許可チェック
    const methodError = checkAllowedMethods(request.method, ALLOWED_METHODS);
    if (methodError) return methodError;

    // 管理者認可チェック（POST は管理者専用）
    const adminUser = await requireAdminAuthorization();
    if (adminUser instanceof Response) {
      return adminUser;
    }

    // RESTful リクエストボディ検証
    const requestBody = await parseRestRequestBody(request, isValidPostCreateRequest);
    if (requestBody instanceof Response) {
      return requestBody;
    }

    // PostInput構築（厳格な型）
    const postData: PostInput = {
      title: requestBody.title.trim(),
      content: requestBody.content.trim(),
      author: adminUser.username,
      slug: generateRestSlug(requestBody.title),
    } as const;

    // 投稿作成実行
    const createResult = await postRepository.create(postData);

    if (!isApiSuccess(createResult)) {
      // 重複スラッグエラーの特別処理（データベースエラーメッセージをチェック）
      const errorMessage = JSON.stringify(createResult.error || {});
      if (errorMessage.includes('slug') && errorMessage.includes('duplicate')) {
        return createRestErrorResponse(
          RestErrorCode.RESOURCE_CONFLICT,
          'A post with this title already exists. Please choose a different title.',
          HttpStatus.CONFLICT,
          ['title'],
          'title'
        );
      }
      
      return createRestErrorResponse(
        RestErrorCode.INTERNAL_ERROR,
        'Failed to create the post due to a database error.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // RESTリソースに変換
    const { origin } = new URL(request.url);
    const postResource = transformToPostResource(createResult.data, origin);

    // RESTful 作成成功レスポンス
    return createRestDataResponse(
      postResource,
      'Post created successfully.',
      HttpStatus.CREATED
    );

  } catch (error) {
    console.error('[POST /api/posts] Internal error:', error);
    return createRestErrorResponse(
      RestErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred while creating the post.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
