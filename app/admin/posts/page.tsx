'use client';

import PostList from '@/app/components/PostList';
import { Post } from '@/app/lib/core/types';
import { useSearch } from '@/app/lib/hooks/use-search';
import type { SearchableItem } from '@/app/lib/search-engine';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { EmptySearchResults, SearchBar } from '@/app/lib/ui/components/search/SearchComponents';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

// 厳格な型定義
type FilterType = 'all' | 'published' | 'deleted';

interface PostsApiResponse {
  readonly success: boolean;
  readonly data?: {
    readonly posts?: readonly Post[];
  } | readonly Post[];
  readonly error?: string;
}

interface SearchablePost extends SearchableItem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly author: string;
  readonly createdAt: string;
  readonly updatedAt?: Date;
  readonly isDeleted?: boolean;
  readonly media?: readonly string[];
}

// 厳格な型定義でコンポーネントプロップス
interface LoadingSpinnerProps {
  readonly className?: string;
}

interface ErrorMessageProps {
  readonly message: string;
  readonly className?: string;
}

interface StatsCardProps {
  readonly title: string;
  readonly value: number;
  readonly bgColor: string;
  readonly textColor: string;
}

interface FilterButtonProps {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
  readonly disabled?: boolean;
}

// 高速化されたコンポーネント（メモ化で最適化）
const LoadingSpinner = ({ className = "" }: LoadingSpinnerProps) => (
  <div className={`flex justify-center items-center h-64 ${className}`}>
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
  </div>
);

const ErrorMessage = ({ message, className = "" }: ErrorMessageProps) => (
  <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg ${className}`}>
    {message}
  </div>
);

const StatsCard = ({ title, value, bgColor, textColor }: StatsCardProps) => (
  <div className={`${bgColor} dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700`}>
    <h3 className={`text-sm font-medium ${textColor} dark:text-gray-300`}>{title}</h3>
    <p className={`text-2xl font-bold ${textColor} dark:text-white`}>{value}</p>
  </div>
);

const FilterButton = ({
  active,
  onClick,
  children,
  disabled = false
}: FilterButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
      }`}
  >
    {children}
  </button>
);

export default function PostsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<readonly Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // 検索用データの変換（メモ化で高速化）
  const searchablePosts = useMemo<readonly SearchablePost[]>(() => {
    return posts.map((post): SearchablePost => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      author: post.author,
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt),
      updatedAt: post.updatedAt,
      isDeleted: post.isDeleted,
      media: post.media,
    }));
  }, [posts]);

  // 検索機能の初期化（新しいAPIで高速化・デバウンス付き）
  const search = useSearch(searchablePosts, {
    dateField: 'createdAt',
    debounceMs: 300, // 300ms デバウンス
    enableCache: true, // キャッシュ有効
    maxCacheSize: 100, // キャッシュサイズ
  });

  // 高速化されたAPI呼び出し（エラーハンドリング強化）
  const fetchPosts = useCallback(async (): Promise<void> => {
    if (!user || user.role !== 'admin') return;

    try {
      setIsLoading(true);
      setError(null);

      // RESTful API用のURLパラメータを構築
      const params = new URLSearchParams();
      params.set('admin', 'true'); // 管理者ビューを指定

      if (search.searchTerm.trim()) {
        params.set('search', search.searchTerm.trim());
      }

      const response = await fetch(`/api/posts?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`投稿の取得に失敗しました: ${response.status}`);
      }

      const result = await response.json() as PostsApiResponse;

      // 型安全なAPI応答処理
      if (result.success && result.data) {
        let postsData: readonly Post[] = [];

        // 新しいAPI形式 {success: true, data: {posts: [], total: ...}} に対応
        if (typeof result.data === 'object' && 'posts' in result.data && Array.isArray(result.data.posts)) {
          postsData = result.data.posts;
        }
        // 古いAPI形式 {success: true, data: [...]} に対応
        else if (Array.isArray(result.data)) {
          postsData = result.data;
        }
        else {
          if (process.env.NODE_ENV === 'development') {
            console.error('予期しないAPI応答形式:', result.data);
          }
          setError('API応答の形式が正しくありません');
          setPosts([]);
          return;
        }

        // 型安全性を保証
        const validPosts = postsData.filter((post: unknown): post is Post =>
          post !== null &&
          post !== undefined &&
          typeof post === 'object' &&
          'id' in post &&
          'title' in post &&
          'slug' in post &&
          'content' in post &&
          ('author' in post || 'authorName' in post)
        );

        setPosts(validPosts);
      } else {
        const errorMessage = result.error || '投稿データの取得に失敗しました';
        setError(errorMessage);
        setPosts([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      if (process.env.NODE_ENV === 'development') {
        console.error('投稿取得エラー:', err);
      }
      setError(errorMessage);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, search.searchTerm]);

  useEffect(() => {
    if (!authLoading) {
      fetchPosts();
    }
  }, [authLoading, fetchPosts]);

  // フィルター変更時にデータを再取得
  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      fetchPosts();
    }
  }, [filter, authLoading, user, fetchPosts]);

  // 検索term変更時のデバウンス処理
  useEffect(() => {
    if (user?.role !== 'admin') return;

    const timeoutId = setTimeout(() => {
      fetchPosts();
    }, 500); // 500ms後に検索実行

    return () => clearTimeout(timeoutId);
  }, [search.searchTerm, user, fetchPosts]);

  // 型安全なauthor名取得ヘルパー
  const getAuthorName = useCallback((author: Post['author']): string => {
    if (typeof author === 'string') {
      return author;
    }
    if (author && typeof author === 'object' && 'username' in author) {
      return (author as { username: string }).username;
    }
    return '';
  }, []);

  const filteredPosts = useMemo(() => {
    if (!posts.length) return [];

    let result = posts;

    // ステータスフィルタリング（isDeletedプロパティを使用）
    if (filter !== 'all') {
      if (filter === 'deleted') {
        result = result.filter(post => post.isDeleted === true);
      } else {
        result = result.filter(post => !post.isDeleted);
      }
    }

    // クライアントサイド検索（シンプルな文字列検索）
    if (search.searchTerm.trim()) {
      const searchLower = search.searchTerm.toLowerCase();
      result = result.filter(post => {
        const authorText = getAuthorName(post.author);

        return post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          authorText.toLowerCase().includes(searchLower);
      });
    }

    // 更新日時でソート
    return [...result]
      .map(post => ({
        ...post,
        createdAt: new Date(post.createdAt),
        updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined
      }))
      .sort((a, b) => {
        const dateA = (a.updatedAt || a.createdAt).getTime();
        const dateB = (b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [posts, filter, search.searchTerm, getAuthorName]);

  const stats = useMemo(() => ({
    total: posts?.length || 0,
    published: posts?.filter(post => !post.isDeleted).length || 0,
    deleted: posts?.filter(post => post.isDeleted).length || 0,
  }), [posts]);

  const handlePostDelete = useCallback(async (postId: string, permanent = false) => {
    if (permanent && !confirm('投稿を完全に削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      // DELETE エンドポイントが未実装のため一時的に無効化
      alert('削除機能は現在実装中です。実装が完了するまでお待ちください。');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('投稿削除エラー:', error);
      }
      alert('投稿削除に失敗しました');
    }
  }, []);

  const handlePostRestore = useCallback(async (postId: string) => {
    try {
      // PATCH エンドポイントが未実装のため一時的に無効化
      alert('復元機能は現在実装中です。実装が完了するまでお待ちください。');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('投稿復元エラー:', error);
      }
      alert('投稿復元に失敗しました');
    }
  }, []);

  if (authLoading) {
    return (
      <AdminLayout title="投稿管理">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title="投稿管理">
        <ErrorMessage message="管理者権限が必要です" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="投稿管理">
      <div className="h-full p-6">
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">投稿管理</h1>
              <p className="text-gray-600 dark:text-gray-400">ブログ投稿の作成・編集・管理</p>
            </div>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新規投稿
            </Link>
          </div>

          {/* 統計 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatsCard
              title="総投稿数"
              value={stats.total}
              bgColor="bg-white"
              textColor="text-gray-900"
            />
            <StatsCard
              title="公開済み"
              value={stats.published}
              bgColor="bg-green-50"
              textColor="text-green-700"
            />
            <StatsCard
              title="削除済み"
              value={stats.deleted}
              bgColor="bg-red-50"
              textColor="text-red-700"
            />
          </div>

          {/* フィルターと検索 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* ステータスフィルター */}
              <div className="flex flex-wrap gap-2">
                <FilterButton
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                >
                  すべて ({stats.total})
                </FilterButton>
                <FilterButton
                  active={filter === 'published'}
                  onClick={() => setFilter('published')}
                >
                  公開済み ({stats.published})
                </FilterButton>
                <FilterButton
                  active={filter === 'deleted'}
                  onClick={() => setFilter('deleted')}
                >
                  削除済み ({stats.deleted})
                </FilterButton>
              </div>

              {/* 検索バー */}
              <div className="flex-1 max-w-md lg:max-w-lg">
                <SearchBar
                  search={search}
                  placeholder="タイトル、内容、著者、スラッグで検索... (例: title:記事, content:技術, author:admin)"
                  showHelp={true}
                />
              </div>
            </div>
          </div>

          {/* エラー表示 */}
          {error && <ErrorMessage message={error} />}

          {/* 投稿一覧 */}
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {filteredPosts.length > 0 ? (
                <PostList
                  posts={filteredPosts}
                  onDelete={handlePostDelete}
                  onRestore={handlePostRestore}
                  showActions={true}
                  isAdmin={true}
                  filter={filter}
                />
              ) : (
                <div className="space-y-6">
                  <EmptySearchResults
                    hasSearchTerm={Boolean(search.searchTerm)}
                    emptyMessage={
                      filter === 'deleted'
                        ? '削除された投稿はありません'
                        : '投稿がありません'
                    }
                    noResultsMessage="検索条件に一致する投稿がありません"
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  />

                  {/* 新規投稿ボタン（削除済みフィルターまたは検索中でない場合のみ表示） */}
                  {filter !== 'deleted' && !search.searchTerm && (
                    <div className="text-center">
                      <Link
                        href="/admin/posts/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        新規投稿を作成
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
