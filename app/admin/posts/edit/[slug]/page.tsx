'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth';
import PostContent from '@/app/blog/[slug]/PostContent';
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

export default function EditPost({ params }: { readonly params: Promise<{ slug: string }> }) {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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
    
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    return result;
  };

  // スラッグ変更ハンドラー
  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    setIsCustomSlug(true); // 手動で変更したことを記録
  };

  // 自動生成にリセット
  const resetSlugToAuto = () => {
    const newSlug = generateSlugFromTitle(title);
    setSlug(newSlug);
    setIsCustomSlug(false);
  };

  // paramsの解決
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        const slugValue = resolvedParams.slug;
        setOriginalSlug(slugValue);
        
        // 投稿データを取得
        const response = await fetch(`/api/posts/${slugValue}`);
        if (response.ok) {
          const postData = await response.json();
          setPost(postData);
          setTitle(postData.title);
          setContent(postData.content);
          setSlug(postData.slug);
        } else {
          setError('投稿が見つかりません');
        }
      } catch (error) {
        console.error('投稿データ取得エラー:', error);
        setError('投稿データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    resolveParams();
  }, [params]);

  // タイトル変更時のslug自動更新（カスタムでない場合のみ）
  useEffect(() => {
    if (!isCustomSlug && title) {
      const newSlug = generateSlugFromTitle(title);
      setSlug(newSlug);
    }
  }, [title, isCustomSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !slug.trim()) {
      alert('タイトル、内容、スラッグはすべて必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      // 変数を実際の値に置換してからslugを送信
      const finalSlug = replaceVariables(slug);
      
      const response = await fetch(`/api/posts/${originalSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          content, 
          slug: finalSlug
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
      console.error('更新エラー:', error);
      alert('投稿の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout title="投稿編集">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="投稿編集">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout title="投稿編集">
        <div className="text-center">投稿が見つかりません</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="投稿編集">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">投稿編集</h1>
          <p className="text-gray-600">
            投稿者: <span className="font-medium">{post.author}</span> | 
            作成日: {new Date(post.createdAt).toLocaleDateString()} |
            編集中: <code className="bg-gray-100 px-1 rounded">/blog/{originalSlug}</code>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="投稿のタイトルを入力してください"
              required
              disabled={isSubmitting}
            />
          </div>
          
          {/* Slug編集フィールド */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL スラッグ <span className="text-red-500">*</span>
              </label>
              {isCustomSlug && (
                <button
                  type="button"
                  onClick={resetSlugToAuto}
                  className="text-sm text-blue-600 hover:text-blue-800"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="post-{timestamp}"
              required
              disabled={isSubmitting}
            />
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">
                プレビュー: <code className="bg-gray-100 px-1 rounded text-xs">/blog/{replaceVariables(slug)}</code>
              </p>
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-600">利用可能な変数</summary>
                <div className="mt-1 ml-4">
                  <p><code>{'{timestamp}'}</code> → {getVariables()['{timestamp}']}</p>
                  <p><code>{'{date}'}</code> → {getVariables()['{date}']}</p>
                  <p><code>{'{datetime}'}</code> → {getVariables()['{datetime}']}</p>
                  <p><code>{'{year}'}</code> → {getVariables()['{year}']}</p>
                  <p><code>{'{month}'}</code> → {getVariables()['{month}']}</p>
                  <p><code>{'{day}'}</code> → {getVariables()['{day}']}</p>
                  <p><code>{'{author}'}</code> → {getVariables()['{author}']}</p>
                </div>
              </details>
            </div>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="flex border-b border-gray-300">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={`px-4 py-2 text-sm font-medium ${
                    !showPreview
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className={`px-4 py-2 text-sm font-medium ${
                    showPreview
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  プレビュー
                </button>
              </div>
              {showPreview ? (
                <div className="p-4 min-h-96 bg-white">
                  <PostContent content={content} />
                </div>
              ) : (
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-96 p-4 border-none focus:outline-none focus:ring-0 resize-none"
                  placeholder="マークダウン形式で投稿内容を入力してください..."
                  required
                  disabled={isSubmitting}
                />
              )}
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/admin/posts')}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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
