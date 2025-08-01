import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AdminPostsResponse, 
  AdminUsersResponse, 
  AdminStatsResponse, 
  PaginationParams, 
  PostFilters, 
  UserFilters 
} from './types';

// Generic API Hook
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'API request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Admin Posts Hook with Pagination and Filtering
export function useAdminPosts(
  pagination: PaginationParams = { page: 1, limit: 20 },
  filters: PostFilters = { type: 'all' }
) {
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    params.set('type', filters.type);
    
    if (filters.search) params.set('search', filters.search);
    if (filters.author) params.set('author', filters.author);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    
    return params.toString();
  }, [pagination, filters]);

  const url = `/api/admin/posts` + (queryParams ? `?${queryParams}` : '');
  
  const { data, loading, error, refetch } = useApi<AdminPostsResponse['data']>(url);

  // Memoized computed values
  const stats = useMemo(() => {
    if (!data) return { total: 0, published: 0, deleted: 0 };
    
    return {
      total: data.length,
      published: data.filter(post => !post.isDeleted).length,
      deleted: data.filter(post => post.isDeleted).length
    };
  }, [data]);

  const filteredPosts = useMemo(() => {
    if (!data) return [];
    
    let filtered = [...data];
    
    // Apply type filter
    if (filters.type === 'published') {
      filtered = filtered.filter(post => !post.isDeleted);
    } else if (filters.type === 'deleted') {
      filtered = filtered.filter(post => post.isDeleted);
    }
    
    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(search) ||
        post.content.toLowerCase().includes(search) ||
        post.author.toLowerCase().includes(search)
      );
    }
    
    // Apply author filter
    if (filters.author) {
      filtered = filtered.filter(post => post.author === filters.author);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy!];
        const bValue = b[filters.sortBy!];
        
        // Type-safe comparison
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return filtered;
  }, [data, filters]);

  return {
    posts: filteredPosts,
    stats,
    loading,
    error,
    refetch
  };
}

// Admin Users Hook
export function useAdminUsers(
  pagination: PaginationParams = { page: 1, limit: 20 },
  filters: UserFilters = {}
) {
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    
    if (filters.role) params.set('role', filters.role);
    if (filters.search) params.set('search', filters.search);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    
    return params.toString();
  }, [pagination, filters]);

  const url = `/api/admin/users` + (queryParams ? `?${queryParams}` : '');
  
  return useApi<AdminUsersResponse['data']>(url);
}

// Admin Stats Hook
export function useAdminStats() {
  return useApi<AdminStatsResponse['data']>('/api/admin/stats');
}

// Optimized Post Actions Hook
export function usePostActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deletePost = useCallback(async (postId: string, permanent = false) => {
    setLoading(postId);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permanent }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete post');
      }
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(null);
    }
  }, []);

  const restorePost = useCallback(async (postId: string) => {
    setLoading(postId);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/posts/${postId}/restore`, {
        method: 'PATCH',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore post');
      }
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(null);
    }
  }, []);

  return {
    deletePost,
    restorePost,
    loading,
    error
  };
}

// Debounced search hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
