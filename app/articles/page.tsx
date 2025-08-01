
import Link from 'next/link';
import PostList from '@/app/components/PostList';
import { getAllPostsSimple } from '@/app/lib/posts';
import type { PostsListResponse } from '@/app/lib/api-types';
import { isApiSuccess } from '@/app/lib/api-types';



const EmptyState = () => (
  <div className="text-center py-12">
    <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">まだ投稿がありません</p>
    <Link 
      href="/articles/new"
      className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
    >
      最初の投稿を作成
    </Link>
  </div>
);

const ErrorState = () => (
  <div className="max-w-md mx-auto text-center py-12">
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
      投稿の読み込みに失敗しました。しばらく後でもう一度お試しください。
    </div>
  </div>
);

export default async function BlogList() {
  // 型ガード: ApiResponse<T> の success 判定

  try {
    // getAllPostsSimpleはApiResponse<PostsListResponse>を返す想定
    const res = await getAllPostsSimple();
    if (!isApiSuccess<PostsListResponse>(res)) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">ブログ投稿</h1>
          <ErrorState />
        </div>
      );
    }
    const posts = res.data.posts;
    return (
      <div className="w-full min-h-screen px-4 py-10 rounded-none shadow-none bg-gradient-to-br from-indigo-900/90 via-slate-900/85 to-purple-900/80 dark:from-[#232347]/95 dark:via-[#181c20]/90 dark:to-[#3a295a]/90 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ブログ投稿</h1>
          <Link 
            href="/articles/new"
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            新規投稿
          </Link>
        </header>
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <PostList
            posts={posts.map(post => ({
              ...post,
              createdAt: typeof post.createdAt === 'string' ? new Date(post.createdAt) : post.createdAt,
              updatedAt: post.updatedAt ? (typeof post.updatedAt === 'string' ? new Date(post.updatedAt) : post.updatedAt) : undefined,
            }))}
            showActions={false}
            isAdmin={false}
            variant="card"
          />
        )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ブログ投稿取得エラー:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">ブログ投稿</h1>
        <ErrorState />
      </div>
    );
  }
}