import { NextRequest } from 'next/server';
import { getAllPostsForAdmin } from '@/app/lib/posts';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    console.log('管理者投稿API呼び出し - ユーザー:', user.username);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const author = searchParams.get('author') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createErrorResponse('Invalid pagination parameters', 400);
    }
    
    // 削除された投稿も含めて全投稿を取得
    const allPosts = await getAllPostsForAdmin();
    console.log('取得した投稿数:', allPosts.length);
    
    // Sort posts before filtering and pagination for better performance
    allPosts.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
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
    
    // Return paginated response with metadata
    return createSuccessResponse({
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
    });
    
  } catch (error) {
    console.error('管理者投稿API エラー:', error);
    return createErrorResponse('投稿の取得に失敗しました', 500);
  }
});
