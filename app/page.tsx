'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdvancedI18n } from './lib/contexts/advanced-i18n-context';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

const HeroSection = ({ t }: { t: (key: string) => string }) => (
  <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-8">
          {t('common.site.modernBlog')}
          <span className="block text-slate-800 dark:text-white">{t('common.site.platform')}</span>
        </h1>
        <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          {t('common.site.platformDescription')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/articles"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {t('common.navigation.articles')}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/articles/new"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-slate-600 rounded-2xl hover:bg-indigo-50 dark:hover:bg-slate-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {t('common.site.createPost')}
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div className="group p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-700">
    <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
  </div>
);

const FeaturesSection = ({ t }: { t: (key: string) => string }) => (
  <section className="py-24 bg-slate-50 dark:bg-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          {t('common.site.whyChooseUs')}
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('common.site.whyChooseDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={t('common.features.performance.icon')}
          title={t('common.features.performance.title')}
          description={t('common.features.performance.description')}
        />
        <FeatureCard
          icon={t('common.features.design.icon')}
          title={t('common.features.design.title')}
          description={t('common.features.design.description')}
        />
        <FeatureCard
          icon={t('common.features.security.icon')}
          title={t('common.features.security.title')}
          description={t('common.features.security.description')}
        />
      </div>
    </div>
  </section>
);

export default function HomePage() {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useAdvancedI18n();

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const response = await fetch('/api/posts/public?limit=3');

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data) {
            setLatestPosts(result.data);
          } else {
            setLatestPosts([]);
          }
        } else {
          setLatestPosts([]);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch latest posts:', error);
        }
        setLatestPosts([]);
      } finally {
        setLoading(false);
      }
    }; fetchLatestPosts();
  }, []);

  const renderArticlesContent = () => {
    if (latestPosts.length > 0) {
      return latestPosts.map((post) => {
        const createdDate = new Date(post.createdAt);
        const formattedDate = createdDate.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // コンテンツから概要を生成（最初の120文字）
        const excerpt = post.content
          .replace(/<[^>]*>/g, '') // HTMLタグを除去
          .slice(0, 120) + (post.content.length > 120 ? '...' : '');

        // 読了時間を推定（日本語の場合、分あたり400-600文字として計算）
        const readTimeMinutes = Math.max(1, Math.ceil(post.content.length / 500));

        return (
          <article
            key={post.id}
            className="group relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-700 overflow-hidden transform hover:-translate-y-2"
          >
            {/* グラデーション背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative p-8">
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
                  <span>{t('common.site.readTime', { minutes: readTimeMinutes })}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-2 leading-tight">
                {post.title}
              </h3>

              <p className="text-slate-600 dark:text-slate-300 mb-6 line-clamp-3 leading-relaxed">
                {excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
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
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-all duration-300 group-hover:shadow-lg"
                >
                  {t('common.site.readArticle')}
                  <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        );
      });
    }

    // 記事がない場合
    return (
      <div className="col-span-full text-center py-16">
        <div className="text-6xl mb-6">📝</div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
          {t('common.site.noArticles')}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          {t('common.site.noArticlesDescription')}
        </p>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
        >
          <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('common.site.createFirstPost')}
        </Link>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Hero Section */}
      <HeroSection t={t} />

      {/* Features Section */}
      <FeaturesSection t={t} />

      {/* Latest Articles Section */}
      <section className="py-24 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('common.site.latestArticles')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {t('common.site.latestArticlesDescription')}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-700 rounded-3xl p-8 shadow-lg animate-pulse">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded-full w-16"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded mb-6 w-3/4"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded-xl w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {renderArticlesContent()}
            </div>
          )}

          {!loading && latestPosts.length > 0 && (
            <div className="text-center mt-16">
              <Link
                href="/articles"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-2xl transition-all duration-200 transform hover:scale-105"
              >
                {t('common.site.viewAllArticles')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
