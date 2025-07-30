'use client';

import { useState, useEffect } from 'react';
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

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  deletedPosts: number;
  totalUsers: number;
  adminUsers: number;
  recentPosts: Post[];
}

export default function AdminHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    deletedPosts: 0,
    totalUsers: 0,
    adminUsers: 0,
    recentPosts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [postsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/posts'),
        fetch('/api/admin/users')
      ]);

      if (postsResponse.ok && usersResponse.ok) {
        const posts = await postsResponse.json();
        const users = await usersResponse.json();

        const publishedPosts = posts.filter((post: Post) => !post.isDeleted);
        const deletedPosts = posts.filter((post: Post) => post.isDeleted);
        const adminUsers = users.filter((user: User) => user.role === 'admin');
        const recentPosts = publishedPosts
          .sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          totalPosts: posts.length,
          publishedPosts: publishedPosts.length,
          deletedPosts: deletedPosts.length,
          totalUsers: users.length,
          adminUsers: adminUsers.length,
          recentPosts
        });
      } else {
        setError('データの取得に失敗しました');
      }
    } catch (error) {
      console.error('ダッシュボードデータ取得エラー:', error);
      setError('データの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout title="読み込み中...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="管理者ホーム">
      <div className="space-y-8">
        {/* ウェルカムセクション */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">おかえりなさい、{user.displayName}さん</h1>
          <p className="text-blue-100">管理者ダッシュボードへようこそ。サイトの状況を確認し、コンテンツを管理できます。</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">総投稿数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">公開中</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">削除済み</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deletedPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">ユーザー</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">管理者</p>
                <p className="text-2xl font-bold text-gray-900">{stats.adminUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 最近の投稿 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">最近の投稿</h3>
                  <Link
                    href="/admin/posts"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    すべて表示 →
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentPosts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    投稿がありません
                  </div>
                ) : (
                  stats.recentPosts.map((post) => (
                    <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            by {post.author} • {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                          </p>
                          {post.content && (
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {post.content.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            表示
                          </Link>
                          <Link
                            href={`/admin/posts/edit/${post.slug}`}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            編集
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* クイックアクション */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">クイックアクション</h3>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  href="/admin/new"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">新規投稿作成</p>
                    <p className="text-sm text-gray-600">新しい記事を書く</p>
                  </div>
                </Link>

                <Link
                  href="/admin/posts"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">投稿管理</p>
                    <p className="text-sm text-gray-600">記事の編集・削除</p>
                  </div>
                </Link>

                <Link
                  href="/admin/users"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">ユーザー管理</p>
                    <p className="text-sm text-gray-600">権限設定・管理</p>
                  </div>
                </Link>

                <Link
                  href="/"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">サイトを表示</p>
                    <p className="text-sm text-gray-600">公開サイトを確認</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* システム情報 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">システム情報</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">最終ログイン</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date().toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">役割</span>
                    <span className="text-sm font-medium text-blue-600">管理者</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">アカウント</span>
                    <span className="text-sm font-medium text-gray-900">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
