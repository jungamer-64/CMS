import Link from 'next/link';
import { getAllPostsSimple } from '@/app/lib/posts';

const PostCard = ({ post }: { post: any }) => (
  <article className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
    <Link href={`/blog/${post.slug}`}>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 mb-2">
        {post.title}
      </h2>
    </Link>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
      {post.author} • {new Date(post.createdAt).toLocaleDateString('ja-JP')}
    </p>
    {post.content && (
      <p className="text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
        {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
      </p>
    )}
    <Link 
      href={`/blog/${post.slug}`}
      className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium"
    >
      続きを読む →
    </Link>
  </article>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">まだ投稿がありません</p>
    <Link 
      href="/blog/new"
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
  try {
    const posts = await getAllPostsSimple();

    return (
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ブログ投稿</h1>
          <Link 
            href="/blog/new"
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            新規投稿
          </Link>
        </header>
        
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
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