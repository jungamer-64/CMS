'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/lib/auth';
import Link from 'next/link';
import AdminLayout from '@/app/lib/AdminLayout';

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

const PostActions = ({ 
  post, 
  onDelete, 
  onRestore 
}: { 
  post: Post; 
  onDelete: (postId: string, permanent?: boolean) => void; 
  onRestore: (postId: string) => void; 
}) => (
  <div className="flex flex-col space-y-1 ml-4 items-center justify-center">
    {!post.isDeleted ? (
      <>
        <Link
          href={`/blog/${post.slug}`}
          className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-center w-20 flex items-center justify-center"
        >
          表示
        </Link>
        <Link
          href={`/admin/posts/edit/${post.slug}`}
          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 text-sm px-2 py-1 border border-green-300 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-900/30 text-center w-20 flex items-center justify-center"
        >
          編集
        </Link>
        <button
          onClick={() => onDelete(post.id)}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm px-2 py-1 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/30 w-20 text-center flex items-center justify-center"
        >
          削除
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => onRestore(post.id)}
          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 text-sm px-2 py-1 border border-green-300 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-900/30 w-20 text-center flex items-center justify-center"
        >
          復元
        </button>
        <button
          onClick={() => onDelete(post.id, true)}
          className="text-red-800 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 text-sm px-2 py-1 border border-red-600 dark:border-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30 w-20 text-center flex items-center justify-center"
        >
          完全削除
        </button>
      </>
    )}
  </div>
);

const PostCard = ({ 
  post, 
  onDelete, 
  onRestore 
}: { 
  post: Post; 
  onDelete: (postId: string, permanent?: boolean) => void; 
  onRestore: (postId: string) => void; 
}) => (
  <li className={`p-4 ${post.isDeleted ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h3 className={`text-lg font-medium ${
          post.isDeleted 
            ? 'line-through text-gray-500 dark:text-gray-400' 
            : 'text-gray-900 dark:text-white'
        }`}>
          {post.title}
          {post.isDeleted && <span className="ml-2 text-red-600 dark:text-red-400">(削除済み)</span>}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          スラッグ: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{post.slug}</code>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          投稿者: {post.author} | 作成日: {new Date(post.createdAt).toLocaleDateString('ja-JP')}
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <> | 更新日: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</>
          )}
        </p>
        {post.content && (
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
          </p>
        )}
      </div>
      <PostActions post={post} onDelete={onDelete} onRestore={onRestore} />
    </div>
  </li>
);

export default function PostsManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const { user } = useAuth();

  // メモ化された統計とフィルタリング済み投稿
  const { publishedCount, deletedCount, filteredPosts } = useMemo(() => {
    const published = posts.filter(post => !post.isDeleted).length;
    const deleted = posts.filter(post => post.isDeleted).length;
    
    let filtered = [...posts];
    
    // フィルタリング適用
    if (filter === 'published') {
      filtered = posts.filter(post => !post.isDeleted);
    } else if (filter === 'deleted') {
      filtered = posts.filter(post => post.isDeleted);
    }
    
    return {
      publishedCount: published,
      deletedCount: deleted,
      filteredPosts: filtered
    };
  }, [posts, filter]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
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
  };

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
          
          {/* 投稿リスト */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPosts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {filter === 'all' && '投稿がありません'}
                {filter === 'published' && '公開中の投稿がありません'}
                {filter === 'deleted' && '削除された投稿がありません'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={handleDeletePost}
                    onRestore={handleRestorePost}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
