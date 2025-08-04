'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';

export default function NewPostPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated or not admin
  if (!isLoading && (!user || user.role !== 'admin')) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    setIsSaving(true);

    try {
      console.log('送信データ:', { title: title.trim(), content: content.trim() });
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      console.log('レスポンスステータス:', response.status);
      
      const responseData = await response.json();
      console.log('レスポンスデータ:', responseData);

      if (response.ok) {
        // 成功レスポンスの構造を確認
        if (responseData.success) {
          router.push('/admin/posts');
        } else {
          alert('投稿の作成に失敗しました');
        }
      } else {
        // エラーレスポンスの詳細を表示
        const errorMessage = responseData.error || responseData.message || '投稿の作成に失敗しました';
        console.error('API エラー:', errorMessage);
        alert(`エラー: ${errorMessage}`);
      }
    } catch (error) {
      console.error('投稿作成エラー:', error);
      alert('ネットワークエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="新規投稿">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="新規投稿">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">新規投稿作成</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="投稿のタイトルを入力してください"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              rows={20}
              placeholder="投稿の内容をMarkdownで入力してください..."
              required
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.push('/admin/posts')}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              disabled={isSaving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '作成中...' : '投稿を作成'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
