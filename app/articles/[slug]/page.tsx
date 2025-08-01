
import { getPostBySlug } from '@/app/lib/posts';
import Link from 'next/link';
import PostContent from './PostContent';
import Comments from '@/app/components/Comments';
import type { PostResponse } from '@/app/lib/api-types';
import { isApiSuccess } from '@/app/lib/api-types';

export default async function BlogPost({ params }: { readonly params: Promise<{ slug: string }> }) {
  // 型ガード: ApiResponse<T> の success 判定

  const { slug } = await params;
  try {
    const res = await getPostBySlug(slug);
    if (!isApiSuccess<PostResponse>(res)) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">投稿が見つかりません</h1>
            <p className="text-gray-600 mb-4">{res && 'error' in res ? res.error : 'お探しの投稿は存在しないか、削除された可能性があります。'}</p>
            <Link 
              href="/articles"
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              ブログ一覧に戻る
            </Link>
          </div>
        </div>
      );
    }
    const post = res.data.post;
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <nav className="mb-6">
          <Link 
            href="/articles"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← ブログ一覧に戻る
          </Link>
        </nav>
        <article className="bg-white rounded-lg shadow-sm p-8">
          <header className="mb-8">
            <h1 className="post-title text-4xl font-bold mb-4 text-gray-900">{post.title}</h1>
            <div className="flex items-center text-gray-600 text-sm">
              <span>投稿者: {post.author}</span>
              <span className="mx-2">•</span>
              <time dateTime={post.createdAt.toString()}>
                {new Date(post.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <>
                  <span className="mx-2">•</span>
                  <span>
                    更新: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}
                  </span>
                </>
              )}
            </div>
          </header>
          <div className="prose prose-lg max-w-none">
            <PostContent content={post.content} />
          </div>
          <Comments postSlug={post.slug} />
        </article>
      </div>
    );
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">投稿の読み込み中にエラーが発生しました。</p>
          <Link 
            href="/articles"
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            ブログ一覧に戻る
          </Link>
        </div>
      </div>
    );
  }
}
