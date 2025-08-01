import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { getAllPostsForAdmin } from '@/app/lib/posts';
import type { AdminPostsListParams } from '@/app/lib/api-types';
import type { Post } from '@/app/lib/types';

interface AdminPostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: AdminPostsListParams;
}

// Type guard function for admin posts list parameters
function parseAdminPostsParams(searchParams: URLSearchParams): Required<AdminPostsListParams> {
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const author = searchParams.get('author');
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  return {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
    type: type === 'published' || type === 'deleted' ? type : 'all',
    search: search || '',
    author: author || '',
    sortBy: sortBy === 'updatedAt' || sortBy === 'title' ? sortBy : 'createdAt',
    sortOrder: sortOrder === 'desc' ? sortOrder : 'asc'
  };
}

// Validation function for admin posts parameters
function validateAdminPostsParams(params: Required<AdminPostsListParams>): string | null {
  if (params.page < 1) {
    return 'ページ番号は1以上でなければなりません';
  }
  if (params.limit < 1 || params.limit > 100) {
    return '1回の取得件数は1〜100の範囲でなければなりません';
  }
  return null;
}

// 管理者用投稿一覧取得API（管理者権限必須）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  console.log('管理者投稿API呼び出し - ユーザー:', user.username);

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters using type-safe functions
    const params = parseAdminPostsParams(searchParams);
    const validationError = validateAdminPostsParams(params);
    
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }
    
    const { page, limit, type, search, author, sortBy, sortOrder } = params;
    
    // 削除された投稿も含めて全投稿を取得
    const allPosts = await getAllPostsForAdmin();
    console.log('取得した投稿数:', allPosts.length);
    
    // Sort posts before filtering and pagination for better performance
    allPosts.sort((a: Post, b: Post) => {
      const aValue = a[sortBy as keyof Post];
      const bValue = b[sortBy as keyof Post];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Filter posts based on type
    let filteredPosts = allPosts;
    if (type === 'published') {
      filteredPosts = allPosts.filter(post => !post.isDeleted);
    } else if (type === 'deleted') {
      filteredPosts = allPosts.filter(post => post.isDeleted);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.author.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply author filter
    if (author) {
      filteredPosts = filteredPosts.filter(post => post.author === author);
    }
    
    // Calculate pagination
    const total = filteredPosts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    const response: AdminPostsResponse = {
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      },
      filters: {
        type,
        search,
        author,
        sortBy,
        sortOrder
      }
    };
    
    return createSuccessResponse(response, '管理者投稿一覧を取得しました');
    
  } catch (error) {
    console.error('管理者投稿API エラー:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : '投稿の取得に失敗しました',
      500
    );
  }
});
