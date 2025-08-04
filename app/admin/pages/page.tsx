'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { StaticPage, PageStatus } from '@/app/lib/core/types';

const StatusBadge: React.FC<{ status: PageStatus }> = ({ status }) => {
  const getStatusStyle = (status: PageStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'private':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: PageStatus) => {
    switch (status) {
      case 'published':
        return '公開中';
      case 'draft':
        return '下書き';
      case 'private':
        return 'プライベート';
      default:
        return '不明';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
};

const PageCard: React.FC<{
  page: StaticPage;
  onStatusChange: (id: string, status: PageStatus) => void;
  onDelete: (id: string) => void;
}> = ({ page, onStatusChange, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
              {page.title}
            </h3>
            <StatusBadge status={page.status || 'draft'} />
            {page.isHomePage && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                ホームページ
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            スラッグ: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{page.slug}</code>
          </div>
          
          {page.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {page.excerpt}
            </p>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-500">
            作成日: {new Date(page.createdAt).toLocaleDateString('ja-JP')}
            {page.updatedAt && page.updatedAt !== page.createdAt && (
              <span className="ml-2">
                更新日: {new Date(page.updatedAt).toLocaleDateString('ja-JP')}
              </span>
            )}
          </div>
        </div>

        <div className="relative ml-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <Link
                  href={`/admin/pages/edit/${page.id}`}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  編集
                </Link>
                
                <Link
                  href={`/${page.slug}`}
                  target="_blank"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  プレビュー
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                <button
                  onClick={() => onStatusChange(page.id, page.status === 'published' ? 'draft' : 'published')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {page.status === 'published' ? '下書きに戻す' : '公開する'}
                </button>

                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                <button
                  onClick={() => onDelete(page.id)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  削除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PagesManager() {
  const { user } = useAuth();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<StaticPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PageStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pages');
      if (response.ok) {
        const result = await response.json();
        // 統一APIレスポンス形式に対応
        if (result.success && Array.isArray(result.data)) {
          setPages(result.data);
        } else if (Array.isArray(result)) {
          // 古い形式との互換性
          setPages(result);
        } else {
          console.error('予期しないレスポンス形式:', result);
          setPages([]);
        }
      }
    } catch (error) {
      console.error('固定ページ取得エラー:', error);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPages();
    }
  }, [user]);

  useEffect(() => {
    const filterPages = () => {
      if (!Array.isArray(pages)) {
        setFilteredPages([]);
        return;
      }

      let filtered = pages;

      if (statusFilter !== 'all') {
        filtered = filtered.filter(page => page.status === statusFilter);
      }

      if (searchQuery) {
        filtered = filtered.filter(page =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFilteredPages(filtered);
    };

    filterPages();
  }, [pages, statusFilter, searchQuery]);

  const handleStatusChange = async (id: string, newStatus: PageStatus) => {
    try {
      const response = await fetch(`/api/pages?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setPages(prev => prev.map(page =>
          page.id === id ? { ...page, status: newStatus } : page
        ));
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この固定ページを削除しますか？')) return;

    try {
      const response = await fetch(`/api/pages?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPages(prev => prev.filter(page => page.id !== id));
      }
    } catch (error) {
      console.error('削除エラー:', error);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="固定ページ管理">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="固定ページ管理">
      <div className="h-full p-6">
        <div className="space-y-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">固定ページ管理</h1>
              <p className="text-gray-600 dark:text-gray-400">サイトの固定ページを管理</p>
            </div>
            <Link
              href="/admin/pages/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              新規作成
            </Link>
          </div>

          {/* フィルターとサーチ */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ステータス
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PageStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                <option value="all">すべて</option>
                <option value="published">公開中</option>
                <option value="draft">下書き</option>
                <option value="private">プライベート</option>
              </select>
            </div>

            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                検索
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトル、スラッグ、説明で検索..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pages?.length || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">総ページ数</div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-2xl font-bold text-green-600">{pages?.filter(p => p.status === 'published').length || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">公開中</div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-600">{pages?.filter(p => p.status === 'draft').length || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">下書き</div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-600">{pages?.filter(p => p.isHomePage).length || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ホームページ</div>
          </div>
        </div>

        {/* ページ一覧 */}
        <div className="space-y-4">
          {filteredPages.length > 0 ? (
            filteredPages.map(page => (
              <PageCard
                key={page.id}
                page={page}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">固定ページがありません</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                新しい固定ページを作成して始めましょう。
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/pages/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  新規作成
                </Link>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}
