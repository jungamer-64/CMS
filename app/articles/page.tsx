'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllPostsSimple } from '@/app/lib/api/posts-client';
import { useAdvancedI18n } from '@/app/lib/contexts/advanced-i18n-context';
import type { Post } from '@/app/lib/core/types';

const ModernEmptyState = ({ t }: { t: (key: string) => string }) => (
  <div className="text-center py-20">
    <div className="relative">
      <div className="text-8xl mb-8 animate-bounce">📝</div>
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"></div>
    </div>
    <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
      {t('common.articles.noArticles')}
    </h3>
    <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-md mx-auto leading-relaxed">
      {t('common.articles.noArticlesDescription')}
    </p>
    <Link 
      href="/admin/posts/new"
      className="inline-flex items-center px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      <svg className="mr-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {t('common.articles.createFirstArticle')}
    </Link>
  </div>
);

const ModernErrorState = ({ t }: { t: (key: string) => string }) => (
  <div className="max-w-lg mx-auto text-center py-20">
    <div className="text-6xl mb-6">⚠️</div>
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
      <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-4">
        {t('common.articles.loadError')}
      </h3>
      <p className="text-red-600 dark:text-red-300 mb-6">
        {t('common.articles.tryAgain')}
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
      >
        {t('common.articles.retry')}
      </button>
    </div>
  </div>
);

const ModernLoadingState = ({ t }: { t: (key: string) => string }) => (
  <div className="text-center py-20">
    <div className="relative mx-auto mb-8 w-16 h-16">
      <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {t('common.articles.loadingArticles')}
    </h3>
    <p className="text-slate-500 dark:text-slate-400">
      {t('common.articles.loadingWait')}
    </p>
  </div>
);

const ModernArticleCard = ({ post, t }: { post: Post; t: (key: string, variables?: Record<string, string | number>) => string }) => {
  const createdDate = new Date(post.createdAt);
  const formattedDate = createdDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // コンテンツから概要を生成
  const excerpt = post.content
    .replace(/<[^>]*>/g, '')
    .slice(0, 150) + (post.content.length > 150 ? '...' : '');

  // 読了時間を推定
  const readTimeMinutes = Math.max(1, Math.ceil(post.content.length / 500));

  return (
    <article className="group relative bg-white dark:bg-slate-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-700 overflow-hidden transform hover:-translate-y-2">
      {/* グラデーション背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative p-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {t('common.site.articleTag')}
          </span>
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('common.articles.readTime', { minutes: readTimeMinutes })}</span>
          </div>
        </div>
        
        {/* タイトル */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-2 leading-tight">
          {post.title}
        </h2>
        
        {/* 概要 */}
        <p className="text-slate-600 dark:text-slate-300 mb-8 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>
        
        {/* フッター */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(post.author || t('common.site.anonymous')).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{post.author || t('common.site.anonymous')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formattedDate}</p>
            </div>
          </div>
          <Link 
            href={`/articles/${post.slug}`}
            className="inline-flex items-center px-6 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-2xl transition-all duration-300 group-hover:shadow-lg border border-indigo-200 dark:border-indigo-700 hover:border-indigo-600"
          >
            {t('common.site.readArticle')}
            <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default function ArticlesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAdvancedI18n();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getAllPostsSimple();

        if (!res || typeof res !== 'object' || !('success' in res) || !res.success) {
          setError('投稿の読み込みに失敗しました');
          setPosts([]);
          return;
        }

        const postsData = res.data;
        
        if (!Array.isArray(postsData)) {
          setError('投稿データの形式が正しくありません');
          setPosts([]);
          return;
        }

        setPosts(postsData);
      } catch (err) {
        console.error('記事ページ - エラー:', err);
        setError('投稿の読み込み中にエラーが発生しました');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* ヘッダーセクション */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-cyan-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-6">
              {t('common.articles.pageTitle')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
              {t('common.articles.description')}
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {loading ? t('common.articles.loadingArticles') : `${posts.length}件の記事`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* メインコンテンツ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(() => {
            if (loading) {
              return <ModernLoadingState t={t} />;
            }
            if (error) {
              return <ModernErrorState t={t} />;
            }
            if (posts.length === 0) {
              return <ModernEmptyState t={t} />;
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <ModernArticleCard key={post.id} post={post} t={t} />
                ))}
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
