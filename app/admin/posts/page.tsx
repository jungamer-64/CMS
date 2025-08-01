'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/lib/auth';
import Link from 'next/link';
import AdminLayout from '@/app/lib/AdminLayout';
import PostList from '@/app/components/PostList';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

type FilterType = 'all' | 'published' | 'deleted';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
    {message}
  </div>
);

const StatsCard = ({ title, value, bgColor, textColor }: { 
  title: string; 
  value: number; 
  bgColor: string; 
  textColor: string; 
}) => (
  <div className={`${bgColor} dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700`}>
    <h3 className={`text-sm font-medium ${textColor} dark:text-gray-300`}>{title}</h3>
    <p className={`text-2xl font-bold ${textColor} dark:text-white`}>{value}</p>
  </div>
);

const FilterButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-sm rounded-md transition-colors ${
      active
        ? 'bg-slate-600 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);




export default function PostsManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const { user } = useAuth();

  // メモ化された統計
  const { publishedCount, deletedCount } = useMemo(() => {
    const published = posts.filter(post => !post.isDeleted).length;
    const deleted = posts.filter(post => post.isDeleted).length;
    
    return {
      publishedCount: published,
      deletedCount: deleted
    };
  }, [posts]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/posts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿データの取得に失敗しました');
      }
      const data = await response.json();
      // 新しいレスポンス形式に対応
      const postsData = data.success ? data.data.posts : (data.posts || data);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('投稿データ取得エラー:', error);
      setError(error instanceof Error ? error.message : '投稿データの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  // 最適化された削除関数（楽観的更新付き）
  const handleDeletePost = useCallback(async (postId: string, permanent = false) => {
    if (permanent && !confirm('投稿を完全に削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permanent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '投稿削除に失敗しました');
      }
      
      // 楽観的更新: サーバーレスポンスを待たずにUIを更新
      setPosts(prev => {
        if (permanent) {
          return prev.filter(post => post.id !== postId);
        } else {
          return prev.map(post => 
            post.id === postId ? { ...post, isDeleted: true } : post
          );
        }
      });
      
    } catch (error) {
      console.error('投稿削除エラー:', error);
      alert(error instanceof Error ? error.message : '投稿削除に失敗しました');
      // エラー時は再フェッチして状態を修正
      await fetchPosts();
    }
  }, [fetchPosts]);

  // 最適化された復元関数（楽観的更新付き）
  const handleRestorePost = useCallback(async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/restore`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '投稿復元に失敗しました');
      }
      
      // 楽観的更新: サーバーレスポンスを待たずにUIを更新
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, isDeleted: false } : post
      ));
      
    } catch (error) {
      console.error('投稿復元エラー:', error);
      alert(error instanceof Error ? error.message : '投稿復元に失敗しました');
      // エラー時は再フェッチして状態を修正
      await fetchPosts();
    }
  }, [fetchPosts]);

  if (isLoading || !user) {
    return (
      <AdminLayout title="投稿管理">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="投稿管理">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">投稿管理</h1>
            <p className="text-gray-600 dark:text-gray-400">ブログ投稿の作成、編集、削除の管理</p>
          </div>
          <Link
            href="/admin/new"
            className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors"
          >
            新規投稿
          </Link>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard 
            title="公開中の投稿" 
            value={publishedCount} 
            bgColor="bg-slate-50" 
            textColor="text-slate-800" 
          />
          <StatsCard 
            title="削除済みの投稿" 
            value={deletedCount} 
            bgColor="bg-red-50" 
            textColor="text-red-800" 
          />
          <StatsCard 
            title="総投稿数" 
            value={posts.length} 
            bgColor="bg-gray-50" 
            textColor="text-gray-800" 
          />
        </div>

        {/* フィルターとリスト */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  投稿一覧
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  投稿の詳細情報と操作
                </p>
              </div>
              <div className="flex space-x-2">
                <FilterButton 
                  active={filter === 'all'} 
                  onClick={() => setFilter('all')}
                >
                  すべて ({posts.length})
                </FilterButton>
                <FilterButton 
                  active={filter === 'published'} 
                  onClick={() => setFilter('published')}
                >
                  公開中 ({publishedCount})
                </FilterButton>
                <FilterButton 
                  active={filter === 'deleted'} 
                  onClick={() => setFilter('deleted')}
                >
                  削除済み ({deletedCount})
                </FilterButton>
              </div>
            </div>
          </div>
          
          {/* 投稿リスト共通化 */}
          <PostList
            posts={posts.map(post => {
              let updatedAt = undefined;
              if (post.updatedAt) {
                updatedAt = typeof post.updatedAt === 'string' 
                  ? new Date(post.updatedAt) 
                  : post.updatedAt;
              }
              
              return {
                ...post,
                createdAt: typeof post.createdAt === 'string' ? new Date(post.createdAt) : post.createdAt,
                updatedAt,
              };
            })}
            filter={filter}
            onDelete={handleDeletePost}
            onRestore={handleRestorePost}
            showActions={true}
            isAdmin={true}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
