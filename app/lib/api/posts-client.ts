import type { Post, PostResource } from '@/app/lib/core/types/api-unified';

// スタブファイル - 削除されたモジュールの代替
export * from '../core/types/api-unified';
export const getPostBySlug = async (slug: string): Promise<{ success: boolean; data: PostResource | null }> => {
  try {
    // サーバーサイドでの実行を検出
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer
      ? process.env.NEXTAUTH_URL || 'http://localhost:3000'
      : '';

    const url = `${baseUrl}/api/posts/${encodeURIComponent(slug)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, data: null };
    }

    const result = await response.json();

    // RESTful APIレスポンス形式に対応
    if (result.success && result.data) {
      return { success: true, data: result.data };
    } else {
      return { success: false, data: null };
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching post by slug:', err instanceof Error ? err : String(err));
    }
    return { success: false, data: null };
  }
};
export const getAllPosts = async () => { throw new Error('Not implemented'); };
export const getAllPostsSimple = async (): Promise<{ success: boolean; data: Post[] }> => {
  try {
    // サーバーサイドでの実行を検出
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer
      ? process.env.NEXTAUTH_URL || 'http://localhost:3000'
      : '';

    const url = `${baseUrl}/api/posts/public?limit=50`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, data: [] };
    }

    const result = await response.json();

    // RESTful APIレスポンス形式に対応
    if (result.success && result.data) {
      return { success: true, data: result.data };
    } else {
      return { success: false, data: [] };
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching all posts:', err instanceof Error ? err : String(err));
    }
    return { success: false, data: [] };
  }
};
export const getAllPostsForAdmin = async () => { throw new Error('Not implemented'); };
export const updatePostBySlug = async () => { throw new Error('Not implemented'); };
export const deletePostBySlug = async () => { throw new Error('Not implemented'); };
export const deletePost = async () => { throw new Error('Not implemented'); };
export const restorePost = async () => { throw new Error('Not implemented'); };
export const permanentlyDeletePost = async () => { throw new Error('Not implemented'); };
export const createPost = async () => { throw new Error('Not implemented'); };
export const getPostsCollection = async () => { throw new Error('Not implemented'); };

export interface PostFilters {
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: string;
}
