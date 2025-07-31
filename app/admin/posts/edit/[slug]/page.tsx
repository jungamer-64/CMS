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

const PostInfo = ({ post, originalSlug }: { post: Post; originalSlug: string }) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">投稿編集</h1>
    <p className="text-gray-600 dark:text-gray-400">
      投稿者: <span className="font-medium">{post.author}</span> | 
      作成日: {new Date(post.createdAt).toLocaleDateString('ja-JP')} |
      編集中: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/blog/{originalSlug}</code>
    </p>
  </div>
);

const TitleInput = ({ 
  title, 
  onChange, 
  disabled 
}: { 
  title: string; 
  onChange: (value: string) => void; 
  disabled: boolean; 
}) => (
  <div>
    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      タイトル <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      id="title"
      value={title}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      placeholder="投稿のタイトルを入力してください"
      required
      disabled={disabled}
    />
  </div>
);

const SlugInput = ({ 
  slug, 
  onChange, 
  onReset, 
  isCustomSlug, 
  disabled, 
  getVariables, 
  replaceVariables 
}: { 
  slug: string; 
  onChange: (value: string) => void; 
  onReset: () => void; 
  isCustomSlug: boolean; 
  disabled: boolean; 
  getVariables: () => Record<string, string>; 
  replaceVariables: (template: string) => string; 
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        URL スラッグ <span className="text-red-500">*</span>
      </label>
      {isCustomSlug && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          自動生成に戻す
        </button>
      )}
    </div>
    <input
      type="text"
      id="slug"
      value={slug}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      placeholder="post-{timestamp}"
      required
      disabled={disabled}
    />
    <div className="mt-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        プレビュー: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">/blog/{replaceVariables(slug)}</code>
      </p>
      <VariableDetails getVariables={getVariables} />
    </div>
  </div>
);

const VariableDetails = ({ getVariables }: { getVariables: () => Record<string, string> }) => {
  const variables = getVariables();
  
  return (
    <details className="text-xs text-gray-400 dark:text-gray-500">
      <summary className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">利用可能な変数</summary>
      <div className="mt-1 ml-4">
        {Object.entries(variables).map(([key, value]) => (
          <p key={key}>
            <code>{key}</code> → {value}
          </p>
        ))}
      </div>
    </details>
  );
};

const ContentEditor = ({ 
  content, 
  onChange, 
  showPreview, 
  onTogglePreview, 
  disabled 
}: { 
  content: string; 
  onChange: (value: string) => void; 
  showPreview: boolean; 
  onTogglePreview: (preview: boolean) => void; 
  disabled: boolean; 
}) => (
  <div>
    <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      内容 <span className="text-red-500">*</span>
    </label>
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-300 dark:border-gray-600">
        <button
          type="button"
          onClick={() => onTogglePreview(false)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            !showPreview
              ? 'bg-slate-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => onTogglePreview(true)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            showPreview
              ? 'bg-slate-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          プレビュー
        </button>
      </div>
      {showPreview ? (
        <div className="p-4 min-h-96 bg-white dark:bg-gray-800">
          <PostContent content={content} />
        </div>
      ) : (
        <textarea
          id="content"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-96 p-4 border-none focus:outline-none focus:ring-0 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="マークダウン形式で投稿内容を入力してください..."
          required
          disabled={disabled}
        />
      )}
    </div>
  </div>
);

const FormActions = ({ 
  isSubmitting, 
  onCancel 
}: { 
  isSubmitting: boolean; 
  onCancel: () => void; 
}) => (
  <div className="flex space-x-4">
    <button 
      type="submit" 
      className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      disabled={isSubmitting}
    >
      {isSubmitting ? '更新中...' : '更新する'}
    </button>
    
    <button
      type="button"
      onClick={onCancel}
      className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
      disabled={isSubmitting}
    >
      キャンセル
    </button>
  </div>
);

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
      '{date}': now.toISOString().split('T')[0],
      '{datetime}': now.toISOString().replace(/[:.]/g, '-').split('.')[0],
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
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-+)|(-+$)/g, '')
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
    setIsCustomSlug(true);
  };

  // 自動生成にリセット
  const resetSlugToAuto = () => {
    const newSlug = generateSlugFromTitle(title);
    setSlug(newSlug);
    setIsCustomSlug(false);
  };

  // paramsの解決と投稿データ取得
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        const slugValue = resolvedParams.slug;
        setOriginalSlug(slugValue);
        
        const response = await fetch(`/api/posts/${slugValue}`);
        if (!response.ok) {
          throw new Error('投稿が見つかりません');
        }

        const postData = await response.json();
        setPost(postData);
        setTitle(postData.title);
        setContent(postData.content);
        setSlug(postData.slug);
      } catch (error) {
        console.error('投稿データ取得エラー:', error);
        setError(error instanceof Error ? error.message : '投稿データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    resolveParams();
  }, [params]);

  // タイトル変更時のslug自動更新
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '投稿の更新に失敗しました');
      }

      router.push('/admin/posts');
    } catch (error) {
      console.error('更新エラー:', error);
      alert(error instanceof Error ? error.message : '投稿の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
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
        <div className="text-center text-gray-500 dark:text-gray-400">投稿が見つかりません</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="投稿編集">
      <div className="max-w-2xl">
        <PostInfo post={post} originalSlug={originalSlug} />
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <TitleInput 
            title={title} 
            onChange={setTitle} 
            disabled={isSubmitting} 
          />
          
          <SlugInput 
            slug={slug} 
            onChange={handleSlugChange} 
            onReset={resetSlugToAuto} 
            isCustomSlug={isCustomSlug} 
            disabled={isSubmitting} 
            getVariables={getVariables} 
            replaceVariables={replaceVariables} 
          />
          
          <ContentEditor 
            content={content} 
            onChange={setContent} 
            showPreview={showPreview} 
            onTogglePreview={setShowPreview} 
            disabled={isSubmitting} 
          />
          
          <FormActions 
            isSubmitting={isSubmitting} 
            onCancel={() => router.push('/admin/posts')} 
          />
        </form>
      </div>
    </AdminLayout>
  );
}
