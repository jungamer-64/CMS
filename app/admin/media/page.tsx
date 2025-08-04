"use client";

import { useAuth } from '../../lib/ui/contexts/auth-context';
import React, { useState, useCallback, useMemo } from 'react';
import type { JSX } from 'react';
import AdminLayout from '../../lib/ui/components/layouts/AdminLayout';
import { useSearch } from '../../lib/hooks/use-search';
import { SearchBar, EmptySearchResults } from '../../lib/ui/components/search/SearchComponents';
import type { SearchableItem } from '../../lib/search-engine';

// 一時的な型定義とラベル定義
const MEDIA_MANAGEMENT_LABEL = 'メディア管理';

interface MediaItem extends SearchableItem {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  url: string;
  mediaType: 'image' | 'video' | 'other';
}
import Image from 'next/image';

// ファイルサイズ変換ユーティリティをローカルに定義
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// メディアタイプ判定関数
function getMediaType(filename: string): 'image' | 'video' {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.m4v', '.mkv', '.ogv', '.3gp', '.3g2'];
  const ext: string = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return videoExtensions.includes(ext) ? 'video' : 'image';
}


function MediaAdminPage(): JSX.Element {
  // hooks, state
  const { user, isLoading: authLoading } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [editingThumbnail, setEditingThumbnail] = useState<string | null>(null);
  const [thumbnailTime, setThumbnailTime] = useState<number>(0);

  // 検索機能の初期化（filteredItemsとUIコンポーネントで使用）
  const search = useSearch(media, {
    filenameField: 'filename',
    dateField: 'uploadDate',
  });


  // メディア一覧取得
  // メディア一覧取得（DB参照）
  React.useEffect(() => {
    const fetchMedia = async (): Promise<void> => {
      try {
        const res = await fetch('/api/media', {
          credentials: 'include'
        });
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
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
        credentials: 'include'
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
      const res = await fetch('/api/media?files=' + selectedMedia.join(','), {
        method: 'DELETE',
        credentials: 'include'
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
    // 現在フィルタリングされているアイテムから計算
    const currentFiltered = search.filteredItems.filter((m: MediaItem) => {
      // メディアタイプフィルター
      return mediaTypeFilter === 'all' || getMediaType(m.filename) === mediaTypeFilter;
    });

    if (selectedMedia.length === currentFiltered.length) {
      setSelectedMedia([]);
    } else {
      setSelectedMedia(currentFiltered.map((m) => m.filename));
    }
  }, [selectedMedia.length, search.filteredItems, mediaTypeFilter]);

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

  // サムネイル編集
  const handleEditThumbnail = useCallback((filename: string): void => {
    setEditingThumbnail(filename);
    setThumbnailTime(0);
  }, []);

  const handleThumbnailTimeChange = useCallback((time: number): void => {
    setThumbnailTime(time);
  }, []);

  const handleApplyThumbnail = useCallback((filename: string): void => {
    // 動画要素を取得してサムネイル時間を適用
    const videoElement = document.querySelector(`video[data-filename="${filename}"]`) as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = thumbnailTime;
    }
    setEditingThumbnail(null);
  }, [thumbnailTime]);

  const handleCancelThumbnailEdit = useCallback((): void => {
    setEditingThumbnail(null);
    setThumbnailTime(0);
  }, []);

  // 検索・ソート
  const filteredAndSortedMedia: readonly MediaItem[] = useMemo(() => {
    let result = search.filteredItems;
    
    // メディアタイプフィルター
    if (mediaTypeFilter !== 'all') {
      result = result.filter((m: MediaItem) => getMediaType(m.filename) === mediaTypeFilter);
    }
    
    // ソート
    result = [...result].sort((a: MediaItem, b: MediaItem) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.originalName.localeCompare(b.originalName);
      } else if (sortBy === 'date') {
        cmp = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      } else if (sortBy === 'size') {
        cmp = a.size - b.size;
      } else if (sortBy === 'type') {
        // 種類順：画像を先に、動画を後に (image < video)
        const typeA = getMediaType(a.filename);
        const typeB = getMediaType(b.filename);
        if (typeA !== typeB) {
          cmp = typeA === 'image' ? -1 : 1;
        } else {
          // 同じタイプの場合は名前順でサブソート
          cmp = a.originalName.localeCompare(b.originalName);
        }
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [search.filteredItems, sortBy, sortOrder, mediaTypeFilter]);


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
      <div className="h-full p-6">
        <div className="space-y-8 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">メディア管理</h1>
            <p className="text-gray-600 dark:text-gray-400">
              アップロードされたメディアの管理・削除ができます
            </p>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{filteredAndSortedMedia.length}</div>
            <div className="text-gray-600 dark:text-gray-400">表示中</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedMedia.length}</div>
            <div className="text-gray-600 dark:text-gray-400">選択中</div>
          </div>
        </div>
        {/* 検索・ソート */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            {/* 検索バー */}
            <SearchBar 
              search={search} 
              placeholder="メディアを検索..."
            />
            
            {/* フィルター・ソート行 */}
            <div className="flex gap-2">
              {/* メディアタイプフィルター */}
              <select
                value={mediaTypeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMediaTypeFilter(e.target.value as 'all' | 'image' | 'video')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">すべて</option>
                <option value="image">画像のみ</option>
                <option value="video">動画のみ</option>
              </select>
              {/* ソート */}
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'type')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="date">日付順</option>
                <option value="name">名前順</option>
                <option value="size">サイズ順</option>
                <option value="type">種類順</option>
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
          <EmptySearchResults
            hasSearchTerm={Boolean(search.searchTerm)}
            emptyMessage="メディアがありません"
            noResultsMessage="検索条件に一致するメディアが見つかりません"
          />
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
                const isVideo = getMediaType(item.filename) === 'video';
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
                        {/* メディアタイプバッジ */}
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isVideo 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          }`}>
                            {isVideo ? '動画' : '画像'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* 画像・動画プレビュー */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 overflow-hidden flex items-center justify-center relative">
                      {isVideo ? (
                        <div className="w-full h-full relative">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            data-filename={item.filename}
                            muted
                            onLoadedMetadata={(e) => {
                              // 動画の最初のフレームをサムネイルとして表示
                              const video = e.currentTarget;
                              if (editingThumbnail !== item.filename) {
                                video.currentTime = 0.1; // 0.1秒の位置でサムネイル生成
                              }
                            }}
                          >
                            {/* アクセシビリティのため空のtrack要素を追加（将来的に字幕ファイルがある場合はsrcを設定） */}
                            <track kind="captions" srcLang="ja" label="Japanese captions" />
                            お使いのブラウザは video タグに対応していません。
                          </video>
                          {/* サムネイル編集ボタン */}
                          <button
                            onClick={() => handleEditThumbnail(item.filename)}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70 transition-opacity"
                            title="サムネイルを編集"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <Image
                          src={item.url}
                          alt={item.originalName}
                          className="object-cover"
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
        
        {/* サムネイル編集モーダル */}
        {editingThumbnail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                サムネイルを編集
              </h3>
              {(() => {
                const editingItem = filteredAndSortedMedia.find(item => item.filename === editingThumbnail);
                if (!editingItem) return null;
                
                return (
                  <div className="space-y-4">
                    {/* プレビュー動画 */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <video
                        src={editingItem.url}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                        onTimeUpdate={(e) => {
                          const video = e.currentTarget;
                          handleThumbnailTimeChange(video.currentTime);
                        }}
                      >
                        <track kind="captions" srcLang="ja" label="Japanese captions" />
                        お使いのブラウザは video タグに対応していません。
                      </video>
                    </div>
                    
                    {/* 時間入力 */}
                    <div className="flex items-center gap-4">
                      <label htmlFor="thumbnail-time" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        サムネイル時間 (秒):
                      </label>
                      <input
                        id="thumbnail-time"
                        type="number"
                        min="0"
                        step="0.1"
                        value={thumbnailTime.toFixed(1)}
                        onChange={(e) => handleThumbnailTimeChange(parseFloat(e.target.value) || 0)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-24"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        現在: {thumbnailTime.toFixed(1)}秒
                      </span>
                    </div>
                    
                    {/* ボタン */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelThumbnailEdit}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleApplyThumbnail(editingThumbnail)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        適用
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default MediaAdminPage;
