'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth';
import PostContent from '@/app/blog/[slug]/PostContent';
import AdminLayout from '@/app/lib/AdminLayout';

interface Variables {
  [key: string]: string;
}

interface UploadedImage {
  url: string;
  fileName: string;
  originalName: string;
  alt: string;
  size: number;
  type: string;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="anima  const handleClearAllImages = () => {
    if (images.length > 0 && confirm('すべての画像を削除しますか？この操作は元に戻せません。')) {
      setImages([]);
      clearImagesFromStorage();
    }
  };

  const handleCancel = () => {
    // 画像がある場合は確認を求める
    if (images.length > 0) {
      if (confirm('アップロードした画像がありますが、キャンセルしますか？画像データは保持されます。')) {
        router.push('/admin');
      }
    } else {
      router.push('/admin');
    }
  };-full h-12 w-12 border-b-2 border-slate-500"></div>
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
          rows={20}
          placeholder="投稿の内容を入力してください..."
          required
          disabled={disabled}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          マークダウン記法とHTMLタグが使用できます。
        </p>
      </>
    ) : (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 min-h-[500px] bg-gray-50 dark:bg-gray-800">
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

const MediaTab = ({ 
  images, 
  onImageUpload, 
  onImageUpdate, 
  onImageDelete, 
  onInsertImage,
  onClearAll,
  isUploading 
}: { 
  images: UploadedImage[]; 
  onImageUpload: (file: File) => Promise<void>; 
  onImageUpdate: (index: number, updates: Partial<UploadedImage>) => void; 
  onImageDelete: (index: number) => void; 
  onInsertImage: (image: UploadedImage) => void;
  onClearAll: () => void;
  isUploading: boolean; 
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateMarkdown = (image: UploadedImage) => {
    return `![${image.alt || image.originalName}](${image.url})`;
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">メディア</h3>
          {images.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs px-2 py-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="すべての画像を削除"
            >
              すべて削除
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* アップロードエリア */}
        <button
          type="button"
          className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
        >
          <div className="flex flex-col items-center space-y-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ドラッグ&ドロップまたはクリックして画像をアップロード
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              {isUploading ? 'アップロード中...' : 'ファイルを選択'}
            </label>
          </div>
        </button>

        {/* アップロード済み画像リスト */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {images.map((image, index) => (
            <div key={`${image.fileName}-${index}`} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
              {/* デバッグ情報 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs text-gray-600 dark:text-gray-400 border border-yellow-200 dark:border-yellow-800">
                <p><strong>URL:</strong> {image.url}</p>
                <p><strong>ファイル名:</strong> {image.fileName}</p>
                <p><strong>元の名前:</strong> {image.originalName}</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <img 
                  src={image.url} 
                  alt={image.alt || image.originalName}
                  className="w-16 h-16 object-cover rounded border"
                  onError={(e) => {
                    console.error('=== Image Load Error ===');
                    console.error('Failed to load image:', image.url);
                    console.error('Full URL:', window.location.origin + image.url);
                    console.error('Image object:', image);
                    console.error('Error event:', e);
                    console.error('Current src attribute:', e.currentTarget.src);
                    e.currentTarget.style.border = '2px solid red';
                    e.currentTarget.style.background = '#ffebee';
                    // エラー時の代替表示
                    e.currentTarget.style.display = 'flex';
                    e.currentTarget.style.alignItems = 'center';
                    e.currentTarget.style.justifyContent = 'center';
                    e.currentTarget.style.fontSize = '10px';
                    e.currentTarget.style.color = 'red';
                    e.currentTarget.innerHTML = 'エラー';
                  }}
                  onLoad={() => {
                    console.log('=== Image Load Success ===');
                    console.log('Image loaded successfully:', image.url);
                    console.log('Full URL:', window.location.origin + image.url);
                    console.log('Image object:', image);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {image.originalName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(image.size)}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => onInsertImage(image)}
                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="エディタに挿入"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onImageDelete(index)}
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor={`alt-${image.fileName}-${index}`} className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                  Alt属性 (代替テキスト)
                </label>
                <input
                  id={`alt-${image.fileName}-${index}`}
                  type="text"
                  value={image.alt}
                  onChange={(e) => onImageUpdate(index, { alt: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="画像の説明を入力..."
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Markdownコード:</p>
                <code className="text-gray-800 dark:text-gray-200 break-all">
                  {generateMarkdown(image)}
                </code>
              </div>
            </div>
          ))}
          
          {images.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
              アップロードされた画像はありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('post-{timestamp}');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // LocalStorageキー
  const STORAGE_KEY = 'new-post-images';

  // 画像データをLocalStorageに保存
  const saveImagesToStorage = (imagesToSave: UploadedImage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imagesToSave));
    } catch (error) {
      console.error('Failed to save images to localStorage:', error);
    }
  };

  // LocalStorageから画像データを読み込み
  const loadImagesFromStorage = (): UploadedImage[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load images from localStorage:', error);
      return [];
    }
  };

  // LocalStorageから画像データをクリア
  const clearImagesFromStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear images from localStorage:', error);
    }
  };

  // コンポーネントマウント時にLocalStorageから画像を復元
  useEffect(() => {
    const savedImages = loadImagesFromStorage();
    if (savedImages.length > 0) {
      setImages(savedImages);
    }
  }, []);

  // 画像リストが変更されるたびにLocalStorageに保存
  useEffect(() => {
    saveImagesToStorage(images);
  }, [images]);

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
      
      console.log('Sending post request...');
      console.log('User:', user);
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookieを含めて送信
        body: JSON.stringify({ 
          title, 
          content, 
          slug: finalSlug,
          author: user.displayName 
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const error = await response.json();
        console.error('Post creation error:', error);
        throw new Error(error.error || '投稿の保存に失敗しました');
      }

      // 投稿が成功したら保存された画像データをクリア
      clearImagesFromStorage();
      router.push('/admin/posts');
    } catch (error) {
      console.error('投稿エラー:', error);
      alert(error instanceof Error ? error.message : '投稿の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAllImages = () => {
    if (images.length > 0 && confirm('すべての画像を削除しますか？この操作は元に戻せません。')) {
      setImages([]);
      clearImagesFromStorage();
    }
  };

  const handleCancel = () => {
    // 画像がある場合は確認を求める
    if (images.length > 0) {
      if (confirm('アップロードした画像がありますが、キャンセルしますか？画像データは保持されます。')) {
        router.push('/admin');
      }
    } else {
      router.push('/admin');
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'アップロードに失敗しました');
      }

      const result = await response.json();
      console.log('=== Upload Response Analysis ===');
      console.log('Raw upload result:', result);
      console.log('Result URL:', result.url);
      console.log('Result fileName:', result.fileName);
      console.log('Result originalName:', result.originalName);
      console.log('Full URL path: http://localhost:3000' + result.url);
      
      const newImage: UploadedImage = {
        url: result.url,
        fileName: result.fileName,
        originalName: result.originalName,
        alt: '',
        size: result.size,
        type: result.type,
      };
      
      console.log('=== New Image Object ===');
      console.log('New image object:', newImage);
      console.log('Image URL that will be used:', newImage.url);
      setImages(prev => [...prev, newImage]);
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpdate = (index: number, updates: Partial<UploadedImage>) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, ...updates } : img));
  };

  const handleImageDelete = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleInsertImage = (image: UploadedImage) => {
    const markdown = `![${image.alt || image.originalName}](${image.url})`;
    setContent(prev => prev + '\n\n' + markdown);
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
      <div className="flex gap-6 h-full">
        {/* 左側: メインフォーム */}
        <div className="flex-1 max-w-2xl">
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

        {/* 右側: メディアタブ */}
        <div className="w-80 sticky top-6 h-screen">
          <MediaTab
            images={images}
            onImageUpload={handleImageUpload}
            onImageUpdate={handleImageUpdate}
            onImageDelete={handleImageDelete}
            onInsertImage={handleInsertImage}
            onClearAll={handleClearAllImages}
            isUploading={isUploading}
          />
        </div>
      </div>
    </AdminLayout>
  );
}