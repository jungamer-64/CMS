import { createRestGetHandler, createRestPostHandler } from '@/app/lib/api/factory/rest-factory';
import { CommentCreateRequest, isCommentCreateRequest } from '@/app/lib/api/schemas/validation-schemas';
import { CommentEntity, UserEntity } from '@/app/lib/core/types/entity-types';
import { commentRepository } from '@/app/lib/data/repositories/comment-repository';
import { NextRequest } from 'next/server';

// ============================================================================
// RESTful Resource: Comments (/api/comments) - 統一パターン使用
// ============================================================================

// ============================================================================
// GET /api/comments - コメント一覧取得
// ============================================================================

export const GET = createRestGetHandler<CommentEntity[]>(
  async (request: NextRequest) => {
    const url = new URL(request.url);

    // クエリパラメータ解析
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
    const search = url.searchParams.get('search') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // コメント一覧取得
    const result = await commentRepository.findAll({
      search,
      sortBy,
      sortOrder,
      page,
      limit
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to fetch comments');
    }

    return result.data.data;
  },
  {
    requireAuth: false, // 公開コメントは認証不要
    allowedMethods: ['GET'],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 300 // コメント一覧は頻繁にアクセスされる
    }
  }
);

// ============================================================================
// POST /api/comments - コメント作成
// ============================================================================

export const POST = createRestPostHandler<CommentCreateRequest, CommentEntity>(
  async (request: NextRequest, body: CommentCreateRequest, currentUser?: UserEntity) => {
    if (!currentUser) {
      throw new Error('Authentication required for comment creation');
    }

    // postIdからslugを取得する必要があるが、簡略化してpostIdをslugとして使用
    const postSlug = `post-${body.postId}`;

    // CommentCreateRequestからCommentInputに変換
    const commentInput = {
      content: body.content,
      authorName: currentUser.username,
      authorEmail: currentUser.email,
      postSlug: postSlug
    };

    const result = await commentRepository.create(commentInput);

    if (!result.success || !result.data) {
      // エラーメッセージを適切に取得
      const errorMessage = result.success === false && 'error' in result ? result.error : 'Failed to create comment';
      throw new Error(errorMessage);
    }

    return result.data;
  },
  isCommentCreateRequest,
  {
    requireAuth: true, // コメント作成は認証必須
    allowedMethods: ['POST'],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 30 // コメント作成は制限
    }
  }
);
