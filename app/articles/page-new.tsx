'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import PostList from '@/app/components/PostList';
import { getAllPostsSimple } from '@/app/lib/api/posts-client';
import type { Post } from '@/app/lib/core/types';

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

const LoadingState = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500 mx-auto"></div>
    <p className="text-gray-500 dark:text-gray-400 mt-4">投稿を読み込み中...</p>
  </div>
);

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('記事ページ - 投稿データ取得開始');
        setLoading(true);
        setError(null);

        const res = await getAllPostsSimple();
        console.log('記事ページ - API応答:', res);

        if (!res || typeof res !== 'object' || !('success' in res) || !res.success) {
          console.error('記事ページ - API取得失敗:', res);
          setError('投稿の読み込みに失敗しました');
          setPosts([]);
          return;
        }

        const postsData = res.data;
        
        if (!Array.isArray(postsData)) {
          console.error('記事ページ - 投稿データが配列ではありません:', postsData);
          setError('投稿データの形式が正しくありません');
          setPosts([]);
          return;
        }

        console.log('記事ページ - 投稿データ取得成功:', postsData.length, '件の投稿を取得');
        console.log('記事ページ - 投稿データの詳細:', postsData);
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

  if (loading) {
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
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
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
          <ErrorState />
        </div>
      </div>
    );
  }

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
          <div>
            <div className="text-center py-4 mb-4 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-yellow-800">デバッグ: posts.length = {posts.length}</p>
              <p className="text-yellow-800">posts data: {JSON.stringify(posts)}</p>
            </div>
            <EmptyState />
          </div>
        ) : (
          <PostList
            posts={posts.map(post => {
              const updatedAt = post.updatedAt instanceof Date
                                ? post.updatedAt.toISOString()
                                : String(post.updatedAt);
              
              const serializedPost = {
                id: String(post.id),
                title: String(post.title),
                content: String(post.content),
                author: String(post.author),
                slug: String(post.slug),
                createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt),
                updatedAt,
              };
              return serializedPost as unknown as Post;
            })}
            showActions={false}
            isAdmin={false}
            variant="card"
          />
        )}
      </div>
    </div>
  );
}
