import { getPostBySlug } from '@/app/lib/api/posts-client';
import Link from 'next/link';
import PostContent from './PostContent';
import Comments from '@/app/components/Comments';

interface Post {
  _id?: string;
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const ModernErrorState = ({ title, message, backLink = '/articles' }: { 
  title: string; 
  message: string; 
  backLink?: string; 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center px-4">
    <div className="max-w-lg mx-auto text-center">
      <div className="text-6xl mb-8">😕</div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          {message}
        </p>
        <Link 
          href={backLink}
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
        >
          <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          記事一覧に戻る
        </Link>
      </div>
    </div>
  </div>
);

export default async function BlogPost({ params }: { readonly params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const res = await getPostBySlug(slug);
    
    if (!res || typeof res !== 'object' || !('success' in res) || !res.success) {
      return (
        <ModernErrorState
          title="投稿が見つかりません"
          message={res && typeof res === 'object' && 'error' in res && typeof res.error === 'string' 
            ? res.error 
            : 'お探しの投稿は存在しないか、削除された可能性があります。'}
        />
      );
    }
    
    const post = res.data as Post;
    
    if (!post?.title) {
      return (
        <ModernErrorState
          title="投稿データが無効です"
          message="投稿データが正しく読み込まれませんでした。"
        />
      );
    }

    // 読了時間を推定
    const readTimeMinutes = Math.max(1, Math.ceil(post.content.length / 500));
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        {/* ヘッダーセクション */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-cyan-600/10"></div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* ブレッドクラム */}
            <nav className="mb-8">
              <Link 
                href="/articles"
                className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
              >
                <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                記事一覧に戻る
              </Link>
            </nav>

            {/* 記事ヘッダー */}
            <header className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 mb-6">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {readTimeMinutes}分で読める
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent mb-8 leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center justify-center space-x-6 text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {(post.author || '匿名').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{post.author || '匿名'}</p>
                    <p className="text-sm">
                      {new Date(post.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>
                      更新: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
              </div>
            </header>
          </div>
        </section>

        {/* メインコンテンツ */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-8 sm:p-12">
                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                  <PostContent content={post.content} />
                </div>
              </div>
              
              {/* コメントセクション */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-8 sm:p-12 bg-slate-50 dark:bg-slate-900/50">
                <Comments postSlug={post.slug} />
              </div>
            </article>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return (
      <ModernErrorState
        title="エラーが発生しました"
        message="投稿の読み込み中にエラーが発生しました。しばらく後でもう一度お試しください。"
      />
    );
  }
}
