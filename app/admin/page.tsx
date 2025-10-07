'use client';


import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import { useCMSI18n } from '@/app/lib/contexts/cms-i18n-context';
import Link from 'next/link';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { LoadingSpinner, ErrorMessage } from '@/app/admin/components';
import type { Post, User } from '@/app/lib/core/types';

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

const StatCard = ({ icon, labelKey, value, color }: { 
  icon: React.ReactNode; 
  labelKey: string; 
  value: number; 
  color: string; 
}) => {
  const { t } = useCMSI18n();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t(labelKey)}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

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

const WelcomeSection = ({ userName }: { userName: string }) => {
  const { t } = useCMSI18n();
  
  return (
    <div className="bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-lg p-8 text-white">
      <h1 className="text-3xl font-bold mb-2">
        {t('dashboard.welcome', { name: userName || 'ユーザー' })}
      </h1>
      <p className="text-slate-100 dark:text-slate-200">{t('dashboard.welcomeDescription')}</p>
    </div>
  );
};

const RecentPosts = ({ posts }: { posts: DashboardStats['recentPosts'] }) => {
  const { t } = useCMSI18n();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentPosts.title')}</h3>
          <Link 
            href="/admin/posts"
            className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium"
          >
            {t('dashboard.recentPosts.viewAll')} →
          </Link>
        </div>
      </div>
      <div className="p-6">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              まだ投稿がありません
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              最初の投稿を作成して、サイトにコンテンツを追加しましょう！
            </p>
            <Link 
              href="/admin/posts/new"
              className="inline-flex items-center px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新規投稿を作成
            </Link>
          </div>
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
};

const QuickActions = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useCMSI18n();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.quickActions.title')}</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label={isCollapsed ? 'リストを展開' : 'リストを閉じる'}
          >
            {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="p-6 grid grid-cols-1 gap-3">
          {/* 新規投稿 - メインアクション */}
          <Link 
            href="/admin/posts/new"
            className="flex items-center justify-center w-full px-4 py-3 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('dashboard.quickActions.newPost')}
          </Link>

          {/* その他のアクション */}
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/admin/posts"
              className="flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              投稿管理
            </Link>
            <Link 
              href="/admin/comments"
              className="flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              コメント管理
            </Link>
            <Link 
              href="/admin/media"
              className="flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              メディア管理
            </Link>
            <Link 
              href="/admin/users"
              className="flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              ユーザー管理
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const SystemInfo = ({ user }: { user: { lastLogin?: string; role: string; id: string; email?: string } }) => (
  <div className="admin-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">システム情報</h3>
      </div>
    </div>
    <div className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">最終ログイン</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {new Date().toLocaleDateString('ja-JP')}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">役割</span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">管理者</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">アカウント</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-40">{user.email}</span>
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

  // データ処理用のヘルパー関数
  const processApiData = (postsJson: unknown, usersJson: unknown) => {
    interface PostsApiResponse {
      data?: {
        posts?: Post[];
        total?: number;
        pagination?: { page: number; limit: number; totalPages: number };
      };
    }
    
    interface UsersApiResponse {
      data?: {
        users?: User[];
        total?: number;
        pagination?: { page: number; limit: number; totalPages: number };
      };
    }
    
    const postsData = postsJson as PostsApiResponse;
    const usersData = usersJson as UsersApiResponse;
    
    // 投稿データの処理
    let posts: Post[] = [];
    if (Array.isArray(postsData?.data?.posts)) {
      posts = postsData.data.posts;
    } else if (Array.isArray(postsData?.data)) {
      // data が直接Post[]の場合
      posts = postsData.data;
    } else if (postsData?.data?.posts) {
      console.warn('投稿データが予期しない形式です:', postsData.data);
    }
    
    // ユーザーデータの処理
    let users: User[] = [];
    if (Array.isArray(usersData?.data?.users)) {
      users = usersData.data.users;
    } else if (Array.isArray(usersData?.data)) {
      // data が直接User[]の場合
      users = usersData.data;
    } else if (usersData?.data && 'users' in usersData.data) {
      console.warn('ユーザーデータが予期しない形式です:', usersData.data);
      console.warn('usersフィールドの型:', typeof usersData.data.users);
      console.warn('usersフィールドの値:', usersData.data.users);
    }

    return { posts, users };
  };

  // 統計データ生成用のヘルパー関数
  const generateStats = (posts: Post[], users: User[]): DashboardStats => {
    const publishedPosts = posts.filter((post) => !post.isDeleted);
    const deletedPosts = posts.filter((post) => post.isDeleted);
    const adminUsers = users.filter((user) => user.role === 'admin');
    const recentPosts = [...publishedPosts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        author: post.author,
        createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString()
      }));

    return {
      totalPosts: posts.length,
      publishedPosts: publishedPosts.length,
      deletedPosts: deletedPosts.length,
      totalUsers: users.length,
      adminUsers: adminUsers.length,
      recentPosts
    };
  };

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(''); // エラーをクリア
    
    try {
      const [postsResponse, usersResponse] = await Promise.allSettled([
        fetch('/api/posts?admin=true').then(res => res.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/users').then(res => res.json()).catch(() => ({ success: false, data: [] }))
      ]);

      let postsJson = { success: false, data: [] };
      let usersJson = { success: false, data: [] };

      if (postsResponse.status === 'fulfilled') {
        postsJson = postsResponse.value;
      }
      if (usersResponse.status === 'fulfilled') {
        usersJson = usersResponse.value;
      }

      // データが取得できない場合でも、デフォルト値を設定
      const { posts, users } = processApiData(postsJson, usersJson);
      const newStats = generateStats(posts, users);
      setStats(newStats);
      
      // データが空の場合のメッセージ（エラーではない）
      if (posts.length === 0 && users.length === 0) {
        console.info('ダッシュボード: データが見つかりませんでした。初期状態か、データベースが空の可能性があります。');
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      // エラーメッセージをユーザーフレンドリーに
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setError('サーバーとの通信に問題があります。少し時間をおいてから再度お試しください。');
        } else {
          setError('データの読み込み中に問題が発生しました。ページを再読み込みしてください。');
        }
      } else {
        setError('予期しない問題が発生しました。管理者にお問い合わせください。');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchDashboardData]);


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
      <div className="h-full p-6">
        <div className="space-y-8 animate-fade-in-up max-w-7xl mx-auto">
          <WelcomeSection userName={user.displayName || user.username || 'ユーザー'} />

          {error && <ErrorMessage message={error} />}

          {/* 統計カード */}
          <div className="admin-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              icon={<PostIcon />} 
              labelKey="dashboard.statistics.totalPosts"
              value={stats.totalPosts} 
              color="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800" 
            />
            <StatCard 
              icon={<VisibleIcon />} 
              labelKey="dashboard.statistics.totalPosts"
              value={stats.publishedPosts} 
              color="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900" 
            />
            <StatCard 
              icon={<DeleteIcon />} 
              labelKey="dashboard.statistics.totalPosts"
              value={stats.deletedPosts} 
              color="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-900" 
            />
            <StatCard 
              icon={<UserIcon />} 
              labelKey="dashboard.statistics.totalUsers"
              value={stats.totalUsers} 
              color="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900" 
            />
            <StatCard 
              icon={<AdminIcon />} 
              labelKey="dashboard.statistics.totalUsers"
              value={stats.adminUsers} 
              color="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900" 
            />
          </div>

          {/* メインコンテンツ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 animate-slide-in-right">
              <RecentPosts posts={stats.recentPosts} />
            </div>
            <div className="space-y-6 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <QuickActions />
              <SystemInfo user={user} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHome;
