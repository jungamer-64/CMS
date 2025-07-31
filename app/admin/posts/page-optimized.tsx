'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/lib/auth';
import Link from 'next/link';
import AdminLayout from '@/app/lib/AdminLayout';
import { useAdminPosts, useDebounce, usePostActions } from '@/app/lib/admin-hooks';

// 型定義
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  excerpt?: string;
}

interface PostFilters {
  type: 'all' | 'published' | 'deleted';
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface PaginationParams {
  page: number;
  limit: number;
}

// ユーティリティ関数
const getStatusStyle = (post: Post) => {
  if (post.isDeleted) {
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
  }
  if (post.isPublished) {
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
  }
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
};

const getStatusText = (post: Post) => {
  if (post.isDeleted) return '削除済み';
  if (post.isPublished) return '公開済み';
  return '下書き';
};

// 読み込みスピナー
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
  </div>
);

// エラーメッセージコンポーネント
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
    {message}
  </div>
);

// 統計カード
const StatsCard = ({ 
  title, 
  value, 
  bgColor, 
  textColor 
}: { 
  title: string;
  value: number;
  bgColor: string;
  textColor: string;
}) => (
  <div className={`${bgColor} rounded-lg p-6`}>
    <h3 className={`${textColor} text-lg font-semibold`}>{title}</h3>
    <p className={`${textColor} text-3xl font-bold mt-2`}>{value}</p>
  </div>
);

// フィルタータブ
const FilterTab = ({ 
  label, 
  count, 
  active, 
  onClick 
}: { 
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
    }`}
  >
    {label} ({count})
  </button>
);

// 投稿アクション
interface PostActionsProps {
  postId: string;
  postSlug: string;
  isDeleted: boolean;
  onAction: () => void;
}

const PostActions = ({ postId, postSlug, isDeleted, onAction }: PostActionsProps) => {
  const { deletePost, restorePost, loading } = usePostActions();
  
  const isLoading = loading === postId;
  
  const handleDelete = useCallback(async (permanent = false) => {
    if (isLoading) return;
    
    try {
      await deletePost(postId, permanent);
      onAction();
    } catch (error) {
      console.error('削除エラー:', error);
    }
  }, [deletePost, postId, onAction, isLoading]);
  
  const handleRestore = useCallback(async () => {
    if (isLoading) return;
    
    try {
      await restorePost(postId);
      onAction();
    } catch (error) {
      console.error('復元エラー:', error);
    }
  }, [restorePost, postId, onAction, isLoading]);

  if (isDeleted) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={handleRestore}
          disabled={isLoading}
          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
        >
          {isLoading ? '処理中...' : '復元'}
        </button>
        <button
          onClick={() => handleDelete(true)}
          disabled={isLoading}
          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
        >
          {isLoading ? '処理中...' : '完全削除'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <Link
        href={`/blog/edit/${postSlug}`}
        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
      >
        編集
      </Link>
      <Link
        href={`/blog/${postSlug}`}
        target="_blank"
        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        表示
      </Link>
      <button
        onClick={() => handleDelete(false)}
        disabled={isLoading}
        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
      >
        {isLoading ? '処理中...' : '削除'}
      </button>
    </div>
  );
};

// 検索・フィルターコンポーネント
const SearchAndFilters = ({
  search,
  onSearchChange,
  filters,
  onFiltersChange
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
}) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label htmlFor="search-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          検索
        </label>
        <input
          id="search-input"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="タイトルで検索..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        />
      </div>
      
      <div>
        <label htmlFor="sort-by" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          並び順
        </label>
        <select
          id="sort-by"
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as PostFilters['sortBy'] })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
          <option value="createdAt">作成日</option>
          <option value="updatedAt">更新日</option>
          <option value="title">タイトル</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="sort-order" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          方向
        </label>
        <select
          id="sort-order"
          value={filters.sortOrder}
          onChange={(e) => onFiltersChange({ ...filters, sortOrder: e.target.value as PostFilters['sortOrder'] })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
          <option value="desc">降順</option>
          <option value="asc">昇順</option>
        </select>
      </div>
    </div>
  </div>
);

// メインコンポーネント
export default function PostsManagement() {
  const { user } = useAuth();
  
  const [pagination] = useState<PaginationParams>({ page: 1, limit: 20 });
  const [filters, setFilters] = useState<PostFilters>({ type: 'all', sortBy: 'createdAt', sortOrder: 'desc' });
  const [search, setSearch] = useState('');
  
  // デバウンス検索
  const debouncedSearch = useDebounce(search, 300);
  
  const finalFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch]);

  const { posts, stats, loading, error, refetch } = useAdminPosts(pagination, finalFilters);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title="アクセス拒否">
        <div className="p-6">
          <ErrorMessage message="管理者権限が必要です" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="投稿管理">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="投稿管理">
        <div className="p-6">
          <ErrorMessage message={error} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="投稿管理">
      <div className="p-6">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="総投稿数"
            value={stats.total}
            bgColor="bg-blue-50 dark:bg-blue-900/20"
            textColor="text-blue-700 dark:text-blue-400"
          />
          <StatsCard
            title="公開済み"
            value={stats.published}
            bgColor="bg-green-50 dark:bg-green-900/20"
            textColor="text-green-700 dark:text-green-400"
          />
          <StatsCard
            title="削除済み"
            value={stats.deleted}
            bgColor="bg-red-50 dark:bg-red-900/20"
            textColor="text-red-700 dark:text-red-400"
          />
        </div>

        {/* 検索・フィルター */}
        <SearchAndFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* フィルタータブ */}
        <div className="flex space-x-2 mb-6">
          <FilterTab
            label="すべて"
            count={stats.total}
            active={filters.type === 'all'}
            onClick={() => setFilters({ ...filters, type: 'all' })}
          />
          <FilterTab
            label="公開済み"
            count={stats.published}
            active={filters.type === 'published'}
            onClick={() => setFilters({ ...filters, type: 'published' })}
          />
          <FilterTab
            label="削除済み"
            count={stats.deleted}
            active={filters.type === 'deleted'}
            onClick={() => setFilters({ ...filters, type: 'deleted' })}
          />
        </div>

        {/* 投稿リスト */}
        <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    更新日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {(posts as any[]).map((post: any) => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {post.title}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          /{post.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(post)}`}>
                        {getStatusText(post)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(post.updatedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <PostActions
                        postId={post.id}
                        postSlug={post.slug}
                        isDeleted={post.isDeleted}
                        onAction={handleRefresh}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">投稿が見つかりませんでした。</p>
            </div>
          )}
        </div>

        {/* 新規投稿ボタン */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {posts.length > 0 && `${posts.length}件の投稿を表示中`}
          </div>
          <Link
            href="/blog/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            新規投稿
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
