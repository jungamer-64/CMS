'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export default function HomePage() {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const response = await fetch('/api/posts/public?limit=3');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setLatestPosts(result.data);
          } else {
            console.error('API応答の形式が正しくありません:', result);
            setLatestPosts([]);
          }
        } else {
          console.error('最新記事の取得に失敗しました:', response.status, response.statusText);
          setLatestPosts([]);
        }
      } catch (error) {
        console.error('最新記事の取得に失敗しました:', error);
        setLatestPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  const renderArticlesContent = () => {
    if (latestPosts.length > 0) {
      return latestPosts.map((post) => {
        const createdDate = new Date(post.createdAt);
        const formattedDate = createdDate.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long'
        });
        
        // コンテンツから概要を生成（最初の150文字）
        const excerpt = post.content
          .replace(/<[^>]*>/g, '') // HTMLタグを除去
          .slice(0, 150) + (post.content.length > 150 ? '...' : '');
        
        // 読了時間を推定（日本語の場合、分あたり400-600文字として計算）
        const readTimeMinutes = Math.max(1, Math.ceil(post.content.length / 500));
        
        return (
          <article 
            key={post.id}
            className="group bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-300 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-200 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                  記事
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {readTimeMinutes}分
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200 mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {post.title}
              </h3>
              
              <p className="text-slate-700 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                {excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-500">
                  {formattedDate}
                </span>
                <Link 
                  href={`/articles/${post.slug}`}
                  className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-semibold transition-colors"
                >
                  続きを読む →
                </Link>
              </div>
            </div>
          </article>
        );
      });
    }
    
    // 記事がない場合
    return (
      <div className="col-span-full text-center py-12">
        <div className="text-slate-500 dark:text-slate-500 text-lg mb-4">
          📝
        </div>
        <h3 className="text-slate-800 dark:text-slate-400 text-lg font-semibold mb-2">
          まだ記事がありません
        </h3>
        <p className="text-slate-600 dark:text-slate-500 text-sm">
          最初の記事を投稿してみましょう！
        </p>
        <Link
          href="/admin/new"
          className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          記事を投稿する
        </Link>
      </div>
    );
  };
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 pt-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            <span>技術ブログ運営中</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 mb-6 drop-shadow-sm">
            Tech Blog
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-4 font-medium">
            フロントエンド・バックエンド・DevOpsの技術記事
          </p>
          
          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Next.js、TypeScript、MongoDB、Dockerなどの最新技術を使った開発経験や、
            パフォーマンス最適化、アーキテクチャ設計について発信しています。
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/articles" 
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
            >
              <span className="flex items-center justify-center">
                📚 記事を読む
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
            <Link 
              href="/about" 
              className="px-8 py-4 border-2 border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-300 font-semibold shadow-sm"
            >
              👨‍💻 プロフィール
            </Link>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-200 mb-12">
            使用技術スタック
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Next.js', icon: '⚡', color: 'from-black to-gray-800' },
              { name: 'TypeScript', icon: '🔷', color: 'from-blue-600 to-blue-800' },
              { name: 'MongoDB', icon: '🍃', color: 'from-green-600 to-green-800' },
              { name: 'Tailwind CSS', icon: '🎨', color: 'from-cyan-500 to-blue-500' },
              { name: 'Docker', icon: '🐳', color: 'from-blue-500 to-blue-700' },
              { name: 'Node.js', icon: '🟢', color: 'from-green-500 to-green-700' },
              { name: 'React', icon: '⚛️', color: 'from-blue-400 to-blue-600' },
              { name: 'Vercel', icon: '▲', color: 'from-black to-gray-700' }
            ].map((tech) => (
              <div 
                key={tech.name}
                className="group relative p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-300 dark:border-slate-700"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
                <div className="text-center relative z-10">
                  <div className="text-3xl mb-2">{tech.icon}</div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-200">{tech.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-200 mb-12">
            ブログの特徴
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🚀',
                title: 'パフォーマンス重視',
                description: 'Next.js の最新機能を活用した高速なWebサイト設計と最適化手法について解説'
              },
              {
                icon: '🔒',
                title: 'セキュリティ',
                description: 'JWT認証、API設計、SQLインジェクション対策など実践的なセキュリティ実装'
              },
              {
                icon: '📱',
                title: 'レスポンシブ設計',
                description: 'モバイルファーストなUI/UX設計とTailwind CSSを使った効率的なスタイリング'
              }
            ].map((feature) => (
              <div 
                key={feature.title}
                className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-300 dark:border-slate-700"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-700 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-200">
              最新記事
            </h2>
            <Link 
              href="/articles"
              className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center transition-colors"
            >
              すべて見る
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // ローディング表示
              Array.from({ length: 3 }).map((_, index) => (
                <div 
                  key={`skeleton-post-${index + 1}`}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 overflow-hidden animate-pulse"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-full w-20"></div>
                      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-12"></div>
                    </div>
                    <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded mb-3"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded mb-4 w-3/4"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-16"></div>
                      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              renderArticlesContent()
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
