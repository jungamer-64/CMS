import {
  createDeleteHandler,
  createErrorResponse,
  createOptionalAuthGetHandler,
  createPostHandler,
  createPutHandler,
  createSuccessResponse
} from '@/app/lib/api-factory';
import { connectToDatabase } from '@/app/lib/database/connection';
import { createPostModel, PostStatus } from '@/app/lib/database/models/post';
import { NextRequest } from 'next/server';
// parse helpers used by helper module
import { User } from '@/app/lib/auth-middleware';
import { buildFindAllOptions, mapPostsToFrontend, type FrontendPostListResponse } from '@/app/lib/helpers/posts-helpers';

// ============================================================================
// 型定義
// ============================================================================

interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  status?: PostStatus;
  tags?: string[];
  categories?: string[];
  featuredImage?: string;
  publishedAt?: string;
}

interface UpdatePostRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: PostStatus;
  tags?: string[];
  categories?: string[];
  featuredImage?: string;
  publishedAt?: string;
}

interface PostResponse {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  status: PostStatus;
  authorId: string;
  authorName: string;
  tags: string[];
  categories: string[];
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// GET /api/posts - 投稿一覧取得（データベース版・認証オプション）
// ============================================================================

export const GET = createOptionalAuthGetHandler<FrontendPostListResponse>(
  async (request: NextRequest, user?: User) => {
    try {
      const url = new URL(request.url);

      const options = buildFindAllOptions(url.searchParams, user);

      // データベース接続
      await connectToDatabase();
      const postModel = await createPostModel();

      // 権限チェック（一般ユーザーまたは未認証は公開済み投稿のみ）
      // 投稿一覧取得
      const result = await postModel.findAll(options);

      const posts = mapPostsToFrontend(result.posts);

      const response = {
        posts,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };

      return createSuccessResponse(response);
    } catch (err: unknown) {
      console.error('投稿取得エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('投稿の取得に失敗しました');
    }
  }
);

// ============================================================================
// POST /api/posts - 投稿作成（データベース版）
// ============================================================================

export const POST = createPostHandler<CreatePostRequest, PostResponse>(
  async (request: NextRequest, body: CreatePostRequest, user: User) => {
    // 管理者のみ投稿作成可能
    if (user.role !== 'admin') {
      return createErrorResponse('管理者権限が必要です', 403);
    }

    // バリデーション
    if (!body.title || !body.content || !body.slug) {
      return createErrorResponse('タイトル、内容、スラッグが必要です');
    }

    try {
      // データベース接続
      await connectToDatabase();
      const postModel = await createPostModel();

      // スラッグ重複チェック
      const existingPost = await postModel.findBySlug(body.slug);
      if (existingPost) {
        return createErrorResponse('同じスラッグの投稿が既に存在します');
      }

      // 投稿作成
      const newPost = await postModel.create({
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        title: body.title,
        content: body.content,
        excerpt: body.excerpt,
        slug: body.slug,
        status: body.status || 'draft',
        authorId: user.id,
        authorName: user.displayName || user.username,
        tags: body.tags || [],
        categories: body.categories || [],
        featuredImage: body.featuredImage,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        isDeleted: false
      });

      // レスポンス形式に変換
      const response: PostResponse = {
        id: newPost.id,
        title: newPost.title,
        content: newPost.content,
        excerpt: newPost.excerpt,
        slug: newPost.slug,
        status: newPost.status,
        authorId: newPost.authorId,
        authorName: newPost.authorName,
        tags: newPost.tags,
        categories: newPost.categories,
        featuredImage: newPost.featuredImage,
        publishedAt: newPost.publishedAt?.toISOString(),
        createdAt: newPost.createdAt.toISOString(),
        updatedAt: newPost.updatedAt.toISOString()
      };

      return createSuccessResponse(response);
    } catch (err: unknown) {
      console.error('投稿作成エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('投稿の作成に失敗しました');
    }
  }
);

// ============================================================================
// PUT /api/posts - 投稿更新（データベース版）
// ============================================================================

export const PUT = createPutHandler<UpdatePostRequest & { id: string }, PostResponse>(
  async (request: NextRequest, body: UpdatePostRequest & { id: string }, user: User) => {
    if (!body.id) {
      return createErrorResponse('投稿IDが必要です');
    }

    try {
      // データベース接続
      await connectToDatabase();
      const postModel = await createPostModel();

      // 投稿の存在確認
      const existingPost = await postModel.findById(body.id);
      if (!existingPost) {
        return createErrorResponse('投稿が見つかりません', 404);
      }

      // 権限チェック（作成者または管理者のみ）
      if (existingPost.authorId !== user.id && user.role !== 'admin') {
        return createErrorResponse('この投稿を編集する権限がありません', 403);
      }

      // スラッグ重複チェック（変更時のみ）
      if (body.slug && body.slug !== existingPost.slug) {
        const duplicatePost = await postModel.findBySlug(body.slug);
        if (duplicatePost) {
          return createErrorResponse('同じスラッグの投稿が既に存在します');
        }
      }

      // 更新データを準備
      const updateData: Partial<Omit<import('@/app/lib/database/models/post').PostDocument, '_id' | 'id' | 'createdAt'>> = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.content !== undefined) updateData.content = body.content;
      if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.tags !== undefined) updateData.tags = body.tags;
      if (body.categories !== undefined) updateData.categories = body.categories;
      if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage;
      if (body.publishedAt !== undefined) {
        updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
      }

      // 投稿更新
      const success = await postModel.update(body.id, updateData);
      if (!success) {
        return createErrorResponse('投稿の更新に失敗しました');
      }

      // 更新された投稿を取得
      const updatedPost = await postModel.findById(body.id);
      if (!updatedPost) {
        return createErrorResponse('更新された投稿の取得に失敗しました');
      }

      // レスポンス形式に変換
      const response: PostResponse = {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        excerpt: updatedPost.excerpt,
        slug: updatedPost.slug,
        status: updatedPost.status,
        authorId: updatedPost.authorId,
        authorName: updatedPost.authorName,
        tags: updatedPost.tags,
        categories: updatedPost.categories,
        featuredImage: updatedPost.featuredImage,
        publishedAt: updatedPost.publishedAt?.toISOString(),
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString()
      };

      return createSuccessResponse(response);
    } catch (err: unknown) {
      console.error('投稿更新エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('投稿の更新に失敗しました');
    }
  }
);

// ============================================================================
// DELETE /api/posts - 投稿削除（データベース版）
// ============================================================================

export const DELETE = createDeleteHandler<{ success: boolean }>(
  async (request: NextRequest, user: User) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return createErrorResponse('投稿IDが必要です');
    }

    try {
      // データベース接続
      await connectToDatabase();
      const postModel = await createPostModel();

      // 投稿の存在確認
      const existingPost = await postModel.findById(id);
      if (!existingPost) {
        return createErrorResponse('投稿が見つかりません', 404);
      }

      // 権限チェック（作成者または管理者のみ）
      if (existingPost.authorId !== user.id && user.role !== 'admin') {
        return createErrorResponse('この投稿を削除する権限がありません', 403);
      }

      // 投稿削除（論理削除）
      const success = await postModel.deleteById(id);
      if (!success) {
        return createErrorResponse('投稿の削除に失敗しました');
      }

      return createSuccessResponse({ success: true });
    } catch (err: unknown) {
      console.error('投稿削除エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('投稿の削除に失敗しました');
    }
  }
);
