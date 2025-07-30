'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/app/lib/AdminLayout';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export default function PostsManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'deleted'>('all');
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        const errorData = await response.json();
        console.error('投稿データ取得失敗:', response.status, errorData);
        setError(`投稿データ取得エラー: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('投稿データ取得例外:', error);
      setError('投稿データの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, permanent = false) => {
    if (permanent && !confirm('投稿を完全に削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const url = permanent 
        ? `/api/admin/posts/${postId}?permanent=true` 
        : `/api/admin/posts/${postId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('投稿削除エラー:', error);
      alert('投稿削除に失敗しました');
    }
  };

  const handleRestorePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchPosts();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('投稿復元エラー:', error);
      alert('投稿復元に失敗しました');
    }
  };

  const filteredPosts = posts.filter(post => {
    switch (filter) {
      case 'published':
        return !post.isDeleted;
      case 'deleted':
        return post.isDeleted;
      default:
        return true;
    }
  });

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout title="投稿管理">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1>投稿管理</h1>
            <p className="text-gray-600">ブログ投稿の作成、編集、削除の管理</p>
          </div>
          <Link
            href="/admin/new"
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            新規投稿
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">公開中の投稿</h3>
            <p className="text-2xl font-bold text-blue-900">
              {posts.filter(post => !post.isDeleted).length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-800">削除済みの投稿</h3>
            <p className="text-2xl font-bold text-red-900">
              {posts.filter(post => post.isDeleted).length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-800">総投稿数</h3>
            <p className="text-2xl font-bold text-gray-900">
              {posts.length}
            </p>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  投稿一覧
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  投稿の詳細情報と操作
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  すべて ({posts.length})
                </button>
                <button
                  onClick={() => setFilter('published')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'published'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  公開中 ({posts.filter(p => !p.isDeleted).length})
                </button>
                <button
                  onClick={() => setFilter('deleted')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'deleted'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  削除済み ({posts.filter(p => p.isDeleted).length})
                </button>
              </div>
            </div>
          </div>
          
          {filteredPosts.length === 0 ? (
            <p className="p-4 text-gray-500">
              {(() => {
                if (filter === 'all') return '投稿がありません';
                if (filter === 'published') return '公開中の投稿がありません';
                return '削除済みの投稿がありません';
              })()}
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <li key={post.id} className={`p-4 ${post.isDeleted ? 'bg-red-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium ${post.isDeleted ? 'line-through text-gray-500' : ''}`}>
                        {post.title}
                        {post.isDeleted && <span className="ml-2 text-red-600">(削除済み)</span>}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        スラッグ: <code className="bg-gray-100 px-1 rounded">{post.slug}</code>
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        投稿者: {post.author} | 作成日: {new Date(post.createdAt).toLocaleDateString()}
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <> | 更新日: {new Date(post.updatedAt).toLocaleDateString()}</>
                        )}
                      </p>
                      {post.content && (
                        <p className="text-sm text-gray-700 truncate">
                          {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1 ml-4">
                      {!post.isDeleted ? (
                        <>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-blue-600 hover:text-blue-900 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 text-center"
                          >
                            表示
                          </Link>
                          <Link
                            href={`/admin/edit/${post.slug}`}
                            className="text-green-600 hover:text-green-900 text-sm px-2 py-1 border border-green-300 rounded hover:bg-green-50 text-center"
                          >
                            編集
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-900 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                          >
                            削除
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestorePost(post.id)}
                            className="text-green-600 hover:text-green-900 text-sm px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                          >
                            復元
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id, true)}
                            className="text-red-800 hover:text-red-900 text-sm px-2 py-1 border border-red-600 rounded hover:bg-red-50"
                          >
                            完全削除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
