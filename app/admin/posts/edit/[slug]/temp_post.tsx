'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';

interface Post {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly author: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isDeleted?: boolean;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
    {message}
  </div>
);

export default function EditPostPage({ params }: { readonly params: { readonly slug: string } }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/admin/posts/${params.slug}`);
        if (!response.ok) {
          throw new Error('投稿の取得に失敗しました');
        }
        const postData = await response.json();
        setPost(postData);
        setTitle(postData.title);
        setContent(postData.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user?.role === 'admin') {
      fetchPost();
    }
  }, [params.slug, user, authLoading, router]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/posts/${params.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('投稿の更新に失敗しました');
      }

      alert('投稿を更新しました');
      router.push('/admin/posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <AdminLayout title="投稿編集">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="投稿編集">
        <ErrorMessage message={error} />
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout title="投稿編集">
        <ErrorMessage message="投稿が見つかりません" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="投稿編集">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">投稿編集</h1>
          <p className="text-gray-600 dark:text-gray-400">
            投稿者: <span className="font-medium">{post.author}</span> | 
            作成日: {new Date(post.createdAt).toLocaleDateString('ja-JP')} |
            編集中: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/blog/{params.slug}</code>
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              タイトル
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="投稿のタイトルを入力してください"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              内容
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              rows={20}
              placeholder="投稿の内容をMarkdownで入力してください..."
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => router.push('/admin/posts')}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              disabled={isSaving}
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '保存中...' : '投稿を更新'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}