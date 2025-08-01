"use client";


import { useAuth } from '../../lib/auth';
import React, { useState, useCallback, useMemo } from 'react';
import type { JSX } from 'react';
import AdminLayout from '../../lib/AdminLayout';
import { MEDIA_MANAGEMENT_LABEL } from '../../lib/admin-types';
import type { MediaItem } from '../../lib/types';
import Image from 'next/image';

// ファイルサイズ変換ユーティリティをローカルに定義
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}


function MediaAdminPage(): JSX.Element {
  // hooks, state
  const { user, isLoading: authLoading } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');


  // メディア一覧取得
  // メディア一覧取得（DB参照）
  React.useEffect(() => {
    const fetchMedia = async (): Promise<void> => {
      try {
        const res = await fetch('/api/admin/media');
        if (!res.ok) throw new Error('メディア一覧の取得に失敗しました');
        const data: unknown = await res.json();
        // 型ガード
        if (
          typeof data === 'object' && data !== null &&
          'data' in data &&
          typeof (data as Record<string, unknown>).data === 'object' && (data as Record<string, unknown>).data !== null &&
          Array.isArray((data as { data: Record<string, unknown> }).data.media)
        ) {
          setMedia((data as { data: { media: MediaItem[] } }).data.media);
        } else {
          setMedia([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMedia();
  }, []);

  // ファイルアップロード
  const handleFileUpload = useCallback(async (files: FileList): Promise<void> => {
    if (!files.length) return;
    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file: File) => formData.append('files', file));
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('アップロードに失敗しました');
      const updated: unknown = await res.json();
      if (
        typeof updated === 'object' && updated !== null &&
        'media' in updated && Array.isArray((updated as Record<string, unknown>).media)
      ) {
        setMedia((updated as { media: MediaItem[] }).media);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // 選択削除
  const handleDeleteSelected = useCallback(async (): Promise<void> => {
    if (selectedMedia.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: selectedMedia }),
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      const updated: unknown = await res.json();
      if (
        typeof updated === 'object' && updated !== null &&
        'media' in updated && Array.isArray((updated as Record<string, unknown>).media)
      ) {
        setMedia((updated as { media: MediaItem[] }).media);
      }
      setSelectedMedia([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedMedia]);

  // ドラッグ&ドロップ
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // 全選択・全解除
  const handleSelectAll = useCallback((): void => {
    // filteredAndSortedMediaを動的に計算
    const currentFiltered = media.filter((m: MediaItem) => {
      if (searchTerm) {
        return m.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               m.filename.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });

    if (selectedMedia.length === currentFiltered.length) {
      setSelectedMedia([]);
    } else {
      setSelectedMedia(currentFiltered.map((m) => m.filename));
    }
  }, [selectedMedia.length, media, searchTerm]);

  // 個別選択
  const handleMediaSelect = useCallback((filename: string): void => {
    setSelectedMedia((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  }, []);

  // URLコピー
  const handleCopyUrl = useCallback(async (url: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      // 必要なら通知
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 検索・ソート
  const filteredAndSortedMedia: MediaItem[] = useMemo(() => {
    let result = media;
    if (searchTerm) {
      result = result.filter((m: MediaItem) =>
        m.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    result = [...result].sort((a: MediaItem, b: MediaItem) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.originalName.localeCompare(b.originalName);
      } else if (sortBy === 'date') {
        cmp = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      } else if (sortBy === 'size') {
        cmp = a.size - b.size;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [media, searchTerm, sortBy, sortOrder]);


  // ローディング表示
  if (authLoading) {
    return (
      <AdminLayout title={MEDIA_MANAGEMENT_LABEL}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  // 権限チェック（useAuthのuser情報のみで判定）
  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title={MEDIA_MANAGEMENT_LABEL}>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">管理者権限が必要です</div>
        </div>
      </AdminLayout>
    );
  }


  // メインUI
  return (
    <AdminLayout title={MEDIA_MANAGEMENT_LABEL}>
      <div className="space-y-6">
        <p className="text-gray-600 dark:text-gray-400">
          アップロードされたメディアの管理・削除ができます
        </p>
        <div className="flex gap-2">
          <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
            {isUploading ? 'アップロード中...' : 'メディアをアップロード'}
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          {selectedMedia.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isDeleting ? '削除中...' : '選択したメディアを削除'}
            </button>
          )}
        </div>
        {/* ドラッグ&ドロップエリア */}
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          htmlFor="file-upload-drop"
          aria-label="メディアファイルをアップロード"
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
            accept="image/*,video/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          <div className="text-gray-600 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium">ここにメディアをドラッグ&ドロップ</p>
            <p className="text-sm">または上のボタンをクリックしてファイルを選択</p>
          </div>
        </label>
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{media.length}</div>
            <div className="text-gray-600 dark:text-gray-400">総メディア数</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatFileSize(media.reduce((total: number, m: MediaItem) => total + m.size, 0))}
            </div>
            <div className="text-gray-600 dark:text-gray-400">総容量</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedMedia.length}</div>
            <div className="text-gray-600 dark:text-gray-400">選択中</div>
          </div>
        </div>
        {/* 検索・ソート */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="メディア名で検索..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="date">日付順</option>
                <option value="name">名前順</option>
                <option value="size">サイズ順</option>
              </select>
              <button
                onClick={(): void => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        {/* メディア一覧 */}
        {filteredAndSortedMedia.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {searchTerm ? '検索条件に一致するメディアが見つかりません' : 'メディアがありません'}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* テーブルヘッダー */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMedia.length === filteredAndSortedMedia.length && filteredAndSortedMedia.length > 0}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  すべて選択
                </span>
              </label>
            </div>
            {/* メディアグリッド */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filteredAndSortedMedia.map((item: MediaItem) => {
                const videoExtensions: readonly string[] = ['.mp4', '.webm', '.mov', '.avi', '.m4v', '.mkv', '.ogv', '.3gp', '.3g2'] as const;
                const ext: string = item.filename.substring(item.filename.lastIndexOf('.')).toLowerCase();
                return (
                  <div
                    key={item.filename}
                    className={`border-2 rounded-lg p-3 transition-all ${
                      selectedMedia.includes(item.filename)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedMedia.includes(item.filename)}
                        onChange={(): void => handleMediaSelect(item.filename)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.originalName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(item.size)}
                        </div>
                      </div>
                    </div>
                    {/* 画像・動画プレビュー */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      {videoExtensions.includes(ext) ? (
                        <video
                          src={item.url}
                          controls
                          className="w-full h-full object-cover"
                          poster="/video-thumbnail.png"
                        >
                          <track
                            kind="captions"
                            src=""
                            srcLang="ja"
                            label="Japanese captions"
                          />
                          お使いのブラウザは video タグに対応していません。
                        </video>
                      ) : (
                        <Image
                          src={item.url}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                    </div>
                    {/* 詳細情報 */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>アップロード: {new Date(item.uploadDate).toLocaleDateString('ja-JP')}</div>
                      <div className="truncate">ファイル名: {item.filename}</div>
                    </div>
                    {/* アクション */}
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={async (): Promise<void> => { await handleCopyUrl(item.url); }}
                        className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        URL コピー
                      </button>
                      <button
                        onClick={(): void => { window.open(item.url, '_blank'); }}
                        className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        表示
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default MediaAdminPage;
