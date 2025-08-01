'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/app/lib/AdminLayout';
import PostList from '@/app/components/PostList';

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

        {/* 投稿リスト */}
        <PostList
          posts={posts.map(post => {
            let updatedAt: Date | undefined = undefined;
            if (post.updatedAt) {
              updatedAt = typeof post.updatedAt === 'string' ? new Date(post.updatedAt) : post.updatedAt;
            }
            return {
              ...post,
              createdAt: typeof post.createdAt === 'string' ? new Date(post.createdAt) : post.createdAt,
              updatedAt,
            };
          })}
          filter="all"
          onDelete={handleDeletePost}
          onRestore={handleRestorePost}
          showActions={true}
          isAdmin={true}
        />
      </div>
    </AdminLayout>
  );
}
