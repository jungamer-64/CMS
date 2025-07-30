import Link from 'next/link';
import { getAllPosts } from '@/app/lib/posts';

export default async function BlogList() {
  try {
    const posts = await getAllPosts();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1>ブログ投稿一覧</h1>
          <Link 
            href="/blog/new"
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            新規投稿
          </Link>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">まだ投稿がありません</p>
            <Link 
              href="/blog/new"
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              最初の投稿を作成
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <div key={post.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-gray-600 text-sm mb-3">
                  {post.author} • {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                </p>
                {post.content && (
                  <p className="text-gray-700 line-clamp-3">
                    {post.content.length > 150 
                      ? post.content.substring(0, 150) + '...' 
                      : post.content
                    }
                  </p>
                )}
                <Link 
                  href={`/blog/${post.slug}`}
                  className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  続きを読む →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('ブログ投稿取得エラー:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1>ブログ投稿一覧</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          投稿の読み込みに失敗しました。しばらく後でもう一度お試しください。
        </div>
      </div>
    );
  }
}