import { getCommaSeparatedList, getEnumParam, getOptionalString, parsePaginationParams, parseSortParams } from '../api-utils';
import type { User } from '../core/types';
import type { PostDocument, PostStatus } from '../database/models/post';

export interface FrontendPost {
    id: string;
    title: string;
    content: string;
    slug: string;
    author: string;
    authorId: string;
    excerpt?: string;
    published: boolean;
    featured: boolean;
    tags: string[];
    media: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface FrontendPostListResponse {
    posts: FrontendPost[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function buildFindAllOptions(searchParams: URLSearchParams, user?: User) {
    const { page, limit } = parsePaginationParams(searchParams);
    const { sortField, sortOrder } = parseSortParams(searchParams, 'createdAt', 'desc');
    const sortBy = sortField;

    const search = getOptionalString(searchParams, 'search');
    const allowedStatuses: PostStatus[] = ['draft', 'published', 'archived'];
    const requestedStatus = getEnumParam<PostStatus>(searchParams, 'status', allowedStatuses);
    const authorId = getOptionalString(searchParams, 'authorId');
    const tags = getCommaSeparatedList(searchParams, 'tags');
    const categories = getCommaSeparatedList(searchParams, 'categories');
    const includeDeletedParam = getOptionalString(searchParams, 'includeDeleted');
    const includeDeleted = includeDeletedParam === 'true';

    const isAdmin = user?.role === 'admin';
    let finalStatus = requestedStatus;
    let finalIncludeDeleted = includeDeleted;
    if (!isAdmin) {
        finalStatus = 'published';
        finalIncludeDeleted = false;
    }

    return {
        page,
        limit,
        search,
        status: finalStatus,
        authorId,
        tags,
        categories,
        includeDeleted: finalIncludeDeleted,
        sortBy,
        sortOrder
    };
}

export function mapPostsToFrontend(posts: PostDocument[]): FrontendPost[] {
    return posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        slug: post.slug,
        author: post.authorName,
        authorId: post.authorId,
        excerpt: post.excerpt || '',
        published: post.status === 'published',
        featured: false,
        tags: post.tags || [],
        media: [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
    }));
}
