'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth';
import AdminLayout from '@/app/lib/AdminLayout';
import { useRouter } from 'next/navigation';

interface UploadedImage {
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  url: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchImages();
    }
  }, [user]);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        setError('画像の取得に失敗しました');
      }
    } catch (error) {
      console.error('画像取得エラー:', error);
      setError('画像の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (filename: string) => {
    setSelectedImages(prev => {
      if (prev.includes(filename)) {
        return prev.filter(f => f !== filename);
      } else {
        return [...prev, filename];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.length === filteredAndSortedImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(filteredAndSortedImages.map(img => img.filename));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`選択した${selectedImages.length}個の画像を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filenames: selectedImages }),
      });

      if (response.ok) {
        await fetchImages();
        setSelectedImages([]);
      } else {
        const errorData = await response.json();
        alert(`削除に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('URLをクリップボードにコピーしました');
    });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    
    // 複数ファイルを FormData に追加
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        await fetchImages(); // 画像リストを再取得
        
        let message = result.message;
        if (result.errors && result.errors.length > 0) {
          message += `\n\nエラー:\n${result.errors.join('\n')}`;
        }
        alert(message);
      } else {
        const errorData = await response.json();
        alert(`アップロードに失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredAndSortedImages = images
    .filter(image => 
      image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.originalName.toLowerCase();
          bValue = b.originalName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.uploadDate).getTime();
          bValue = new Date(b.uploadDate).getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (authLoading || isLoading) {
    return (
      <AdminLayout title="画像管理">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout title="画像管理">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">画像管理</h2>
            <p className="text-gray-600 dark:text-gray-400">
              アップロードされた画像の管理・削除ができます
            </p>
          </div>
          <div className="flex gap-2">
            <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
              {isUploading ? 'アップロード中...' : '画像をアップロード'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            {selectedImages.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isDeleting ? '削除中...' : `選択項目を削除 (${selectedImages.length})`}
              </button>
            )}
          </div>
        </div>

        {/* ドラッグ&ドロップエリア */}
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          htmlFor="file-upload-drop"
          aria-label="画像ファイルをアップロード"
          className={`block border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <input
            id="file-upload-drop"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          <div className="text-gray-600 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium">ここに画像をドラッグ&ドロップ</p>
            <p className="text-sm">または上のボタンをクリックしてファイルを選択</p>
          </div>
        </label>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{images.length}</div>
            <div className="text-gray-600 dark:text-gray-400">総画像数</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatFileSize(images.reduce((total, img) => total + img.size, 0))}
            </div>
            <div className="text-gray-600 dark:text-gray-400">総容量</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedImages.length}</div>
            <div className="text-gray-600 dark:text-gray-400">選択中</div>
          </div>
        </div>

        {/* 検索・ソート */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="画像名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="date">日付順</option>
                <option value="name">名前順</option>
                <option value="size">サイズ順</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* 画像一覧 */}
        {filteredAndSortedImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {searchTerm ? '検索条件に一致する画像が見つかりません' : '画像がありません'}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* テーブルヘッダー */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedImages.length === filteredAndSortedImages.length && filteredAndSortedImages.length > 0}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  すべて選択
                </span>
              </label>
            </div>

            {/* 画像グリッド */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filteredAndSortedImages.map((image) => (
                <div
                  key={image.filename}
                  className={`border-2 rounded-lg p-3 transition-all ${
                    selectedImages.includes(image.filename)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.filename)}
                      onChange={() => handleImageSelect(image.filename)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {image.originalName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(image.size)}
                      </div>
                    </div>
                  </div>

                  {/* 画像プレビュー */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* 詳細情報 */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>アップロード: {new Date(image.uploadDate).toLocaleDateString('ja-JP')}</div>
                    <div className="truncate">ファイル名: {image.filename}</div>
                  </div>

                  {/* アクション */}
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => handleCopyUrl(image.url)}
                      className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      URL コピー
                    </button>
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      表示
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
