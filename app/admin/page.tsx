'use client';


import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth';
import Link from 'next/link';
import AdminLayout from '@/app/lib/AdminLayout';
import type { ApiResponse, PostsListResponse, UsersListResponse } from '@/app/lib/api-types';
import { isApiSuccess } from '@/app/lib/api-types';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  deletedPosts: number;
  totalUsers: number;
  adminUsers: number;
  recentPosts: Array<{
    id: string;
    title: string;
    slug: string;
    author: string;
    createdAt: string;
  }>;
}

const StatCard = ({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string; 
}) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const PostIcon = () => (
  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const VisibleIcon = () => (
  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

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

const WelcomeSection = ({ userName }: { userName: string }) => (
  <div className="bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg p-8 text-white">
    <h1 className="text-3xl font-bold mb-2">
      おかえりなさい、{userName || 'ユーザー'}さん
    </h1>
    <p className="text-slate-100">管理者ダッシュボードへようこそ。サイトの状況を確認し、コンテンツを管理できます。</p>
  </div>
);

const RecentPosts = ({ posts }: { posts: DashboardStats['recentPosts'] }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">最近の投稿</h3>
        <Link 
          href="/admin/posts"
          className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium"
        >
          すべて表示 →
        </Link>
      </div>
    </div>
    <div className="p-6">
      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">投稿がまだありません</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="flex justify-between items-center">
              <div>
                <Link 
                  href={`/articles/${post.slug}`}
                  className="text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 font-medium"
                >
                  {post.title}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.author} • {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const QuickActions = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">クイックアクション</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={isCollapsed ? 'リストを展開' : 'リストを閉じる'}
          >
            {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="p-6 space-y-3">
          <Link 
            href="/admin/new"
            className="block w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-center"
          >
            新規投稿
          </Link>
          <Link 
            href="/admin/posts"
            className="block w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
          >
            投稿管理
          </Link>
          <Link 
            href="/admin/comments"
            className="block w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
          >
            コメント管理
          </Link>
          <Link 
            href="/admin/images"
            className="block w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
          >
            画像管理
          </Link>
          <Link 
            href="/admin/users"
            className="block w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
          >
            ユーザー管理
          </Link>
        </div>
      )}
    </div>
  );
};

const SystemInfo = ({ user }: { user: { lastLogin?: string; role: string; id: string; email?: string } }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">システム情報</h3>
    </div>
    <div className="p-6">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">最終ログイン</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {new Date().toLocaleDateString('ja-JP')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">役割</span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">管理者</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">アカウント</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
        </div>
      </div>
    </div>
  </div>
);



const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    deletedPosts: 0,
    totalUsers: 0,
    adminUsers: 0,
    recentPosts: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [postsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/posts'),
        fetch('/api/admin/users')
      ]);

      const postsJson: ApiResponse<PostsListResponse> = await postsResponse.json();
      const usersJson: ApiResponse<UsersListResponse> = await usersResponse.json();

      if (!postsResponse.ok || !isApiSuccess(postsJson)) {
        const msg = postsJson && 'error' in postsJson ? postsJson.error : `投稿データの取得に失敗しました: ${postsResponse.status}`;
        setError(msg);
        setIsLoading(false);
        return;
      }
      if (!usersResponse.ok || !isApiSuccess(usersJson)) {
        const msg = usersJson && 'error' in usersJson ? usersJson.error : `ユーザーデータの取得に失敗しました: ${usersResponse.status}`;
        setError(msg);
        setIsLoading(false);
        return;
      }

      const posts = postsJson.data.posts || [];
      const users = usersJson.data.users || [];

      if (posts.length === 0 && users.length === 0) {
        setError('データベースからデータを取得できませんでした。データベース接続を確認してください。');
        setIsLoading(false);
        return;
      }

      const publishedPosts = posts.filter((post) => !post.isDeleted);
      const deletedPosts = posts.filter((post) => post.isDeleted);
      const adminUsers = users.filter((user) => user.role === 'admin');
      const recentPosts = publishedPosts
        .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          author: post.author,
          createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString()
        }));

      setStats({
        totalPosts: posts.length,
        publishedPosts: publishedPosts.length,
        deletedPosts: deletedPosts.length,
        totalUsers: users.length,
        adminUsers: adminUsers.length,
        recentPosts
      });
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'データの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading || !user) {
    return (
      <AdminLayout title="読み込み中...">
        <div className="space-y-4">
          <LoadingSpinner />
          {!user && !isLoading && (
            <div className="text-center text-red-600">
              認証されていないか、管理者権限がありません。
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <AdminLayout title="アクセス拒否">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">アクセス拒否</h2>
          <p className="text-gray-600">管理者権限が必要です。</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="管理者ホーム">
      <div className="space-y-8">
        <WelcomeSection userName={user.displayName || user.username || 'ユーザー'} />

        {error && <ErrorMessage message={error} />}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard 
            icon={<PostIcon />} 
            label="総投稿数" 
            value={stats.totalPosts} 
            color="bg-slate-100" 
          />
          <StatCard 
            icon={<VisibleIcon />} 
            label="公開中" 
            value={stats.publishedPosts} 
            color="bg-green-100" 
          />
          <StatCard 
            icon={<DeleteIcon />} 
            label="削除済み" 
            value={stats.deletedPosts} 
            color="bg-red-100" 
          />
          <StatCard 
            icon={<UserIcon />} 
            label="ユーザー" 
            value={stats.totalUsers} 
            color="bg-purple-100" 
          />
          <StatCard 
            icon={<AdminIcon />} 
            label="管理者" 
            value={stats.adminUsers} 
            color="bg-orange-100" 
          />
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentPosts posts={stats.recentPosts} />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <SystemInfo user={user} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHome;
