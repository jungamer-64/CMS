'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth';
import PostContent from '@/app/blog/[slug]/PostContent';
import AdminLayout from '@/app/lib/AdminLayout';

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('post-{timestamp}');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // 利用可能な変数
  const getVariables = () => {
    const now = new Date();
    return {
      '{timestamp}': Date.now().toString(),
      '{date}': now.toISOString().split('T')[0], // YYYY-MM-DD
      '{datetime}': now.toISOString().replace(/[:.]/g, '-').split('.')[0], // YYYY-MM-DDTHH-mm-ss
      '{year}': now.getFullYear().toString(),
      '{month}': (now.getMonth() + 1).toString().padStart(2, '0'),
      '{day}': now.getDate().toString().padStart(2, '0'),
      '{hour}': now.getHours().toString().padStart(2, '0'),
      '{minute}': now.getMinutes().toString().padStart(2, '0'),
      '{author}': user?.email?.split('@')[0] || 'user',
    };
  };

  // タイトルからslugを自動生成
  const generateSlugFromTitle = (titleValue: string) => {
    const baseSlug = titleValue
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // 英数字とスペースのみ
      .replace(/\s+/g, '-') // スペースをハイフンに変換
      .replace(/-+/g, '-') // 連続するハイフンを単一に
      .replace(/(^-+)|(-+$)/g, '') // 先頭末尾のハイフンを削除
      .trim();
    
    return baseSlug && baseSlug.length >= 3 
      ? `${baseSlug}-{timestamp}` 
      : 'post-{timestamp}';
  };

  // 変数を実際の値に置換
  const replaceVariables = (slugTemplate: string) => {
    const variables = getVariables();
    let result = slugTemplate;
    Object.entries(variables).forEach(([variable, value]) => {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return result;
  };

  // タイトル変更時にslugを自動生成（カスタムslugでない場合）
  useEffect(() => {
    if (!isCustomSlug) {
      if (title) {
        setSlug(generateSlugFromTitle(title));
      } else {
        setSlug('post-{timestamp}');
      }
    }
  }, [title, isCustomSlug]);

  // slug入力フィールドの変更
  const handleSlugChange = (value: string) => {
    setSlug(value);
    setIsCustomSlug(true);
  };

  // slug自動生成をリセット
  const resetSlugToAuto = () => {
    setIsCustomSlug(false);
    setSlug(generateSlugFromTitle(title));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // 変数を実際の値に置換してからslugを送信
      const finalSlug = replaceVariables(slug);
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          content, 
          slug: finalSlug,
          author: user.displayName 
        }),
      });

      if (response.ok) {
        // 管理者の投稿管理ページにリダイレクト
        router.push('/admin/posts');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('投稿の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <AdminLayout title="新規投稿">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="新規投稿作成">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-gray-900 dark:text-white">新規投稿作成</h1>
          <p className="text-gray-600 dark:text-gray-400">投稿者: <span className="font-medium">{user.displayName}</span></p>
        </div>
      
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="投稿のタイトルを入力してください"
            required
            disabled={isSubmitting}
          />
        </div>
        
        {/* Slug編集フィールド */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL スラッグ <span className="text-red-500">*</span>
            </label>
            {isCustomSlug && (
              <button
                type="button"
                onClick={resetSlugToAuto}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                自動生成に戻す
              </button>
            )}
          </div>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="post-{timestamp}"
            required
            disabled={isSubmitting}
          />
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-1">プレビュー: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/blog/{slug ? replaceVariables(slug) : 'post-' + Date.now()}</code></p>
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">利用可能な変数</summary>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(getVariables()).map(([variable, value]) => (
                    <div key={variable} className="flex justify-between">
                      <code className="text-blue-600 dark:text-blue-400">{variable}</code>
                      <span className="text-gray-600 dark:text-gray-400">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  例: <code>my-post-{'{timestamp}'}</code> → <code>my-post-{Date.now()}</code>
                </p>
              </div>
            </details>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              内容 <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-3 py-1 text-sm rounded ${
                  !showPreview 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-3 py-1 text-sm rounded ${
                  showPreview 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                プレビュー
              </button>
            </div>
          </div>
          
          {!showPreview ? (
            <>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={12}
                placeholder="投稿の内容を入力してください..."
                required
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                マークダウン記法とHTMLタグが使用できます。
              </p>
            </>
          ) : (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 min-h-[300px] bg-gray-50 dark:bg-gray-800">
              {content ? (
                <PostContent content={content} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">プレビューするには内容を入力してください</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button 
            type="submit" 
            className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white px-6 py-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? '投稿中...' : '投稿する'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
}