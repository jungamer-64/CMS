'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth';
import PostContent from '@/app/blog/[slug]/PostContent';
import AdminLayout from '@/app/lib/AdminLayout';

interface Variables {
  [key: string]: string;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
  </div>
);

const TitleInput = ({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string; 
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
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      placeholder="投稿のタイトルを入力してください"
      required
      disabled={disabled}
    />
  </div>
);

const SlugInput = ({ 
  value, 
  onChange, 
  onReset, 
  isCustom, 
  variables, 
  disabled 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  onReset: () => void; 
  isCustom: boolean; 
  variables: Variables; 
  disabled: boolean; 
}) => {
  const replaceVariables = (slugTemplate: string) => {
    let result = slugTemplate;
    Object.entries(variables).forEach(([variable, replacementValue]) => {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), replacementValue);
    });
    return result;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          URL スラッグ <span className="text-red-500">*</span>
        </label>
        {isCustom && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
          >
            自動生成に戻す
          </button>
        )}
      </div>
      <input
        type="text"
        id="slug"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="post-{timestamp}"
        required
        disabled={disabled}
      />
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-1">
          プレビュー: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/blog/{value ? replaceVariables(value) : 'post-' + Date.now()}</code>
        </p>
        <VariableDetails variables={variables} />
      </div>
    </div>
  );
};

const VariableDetails = ({ variables }: { variables: Variables }) => (
  <details className="mt-2">
    <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300">
      利用可能な変数
    </summary>
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Object.entries(variables).map(([variable, value]) => (
          <div key={variable} className="flex justify-between">
            <code className="text-slate-600 dark:text-slate-400">{variable}</code>
            <span className="text-gray-600 dark:text-gray-400">{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        例: <code>my-post-{'{timestamp}'}</code> → <code>my-post-{Date.now()}</code>
      </p>
    </div>
  </details>
);

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
  onTogglePreview: (show: boolean) => void; 
  disabled: boolean; 
}) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        内容 <span className="text-red-500">*</span>
      </label>
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => onTogglePreview(false)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            !showPreview 
              ? 'bg-slate-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => onTogglePreview(true)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            showPreview 
              ? 'bg-slate-500 text-white' 
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
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={12}
          placeholder="投稿の内容を入力してください..."
          required
          disabled={disabled}
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
      className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800 text-white px-6 py-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      disabled={isSubmitting}
    >
      {isSubmitting ? '投稿中...' : '投稿する'}
    </button>
    
    <button
      type="button"
      onClick={onCancel}
      className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
      disabled={isSubmitting}
    >
      キャンセル
    </button>
  </div>
);

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('post-{timestamp}');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const getVariables = (): Variables => {
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

  const generateSlugFromTitle = (titleValue: string): string => {
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

  const replaceVariables = (slugTemplate: string): string => {
    const variables = getVariables();
    let result = slugTemplate;
    Object.entries(variables).forEach(([variable, value]) => {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return result;
  };

  useEffect(() => {
    if (!isCustomSlug) {
      setSlug(title ? generateSlugFromTitle(title) : 'post-{timestamp}');
    }
  }, [title, isCustomSlug]);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setIsCustomSlug(true);
  };

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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '投稿の保存に失敗しました');
      }

      router.push('/admin/posts');
    } catch (error) {
      console.error('投稿エラー:', error);
      alert(error instanceof Error ? error.message : '投稿の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  if (!user) {
    return (
      <AdminLayout title="新規投稿">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="新規投稿作成">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">新規投稿作成</h1>
          <p className="text-gray-600 dark:text-gray-400">
            投稿者: <span className="font-medium">{user.displayName}</span>
          </p>
        </div>
      
        <form onSubmit={handleSubmit} className="space-y-6">
          <TitleInput 
            value={title} 
            onChange={setTitle} 
            disabled={isSubmitting} 
          />
          
          <SlugInput 
            value={slug}
            onChange={handleSlugChange}
            onReset={resetSlugToAuto}
            isCustom={isCustomSlug}
            variables={getVariables()}
            disabled={isSubmitting}
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
            onCancel={handleCancel} 
          />
        </form>
      </div>
    </AdminLayout>
  );
}