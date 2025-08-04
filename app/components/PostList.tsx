'use client';

import React from 'react';
// マークダウンやHTMLタグを要素名に置換し、残りはテキストのみ抽出
function summarizeContent(text: string): string {
  // HTMLタグを要素名に置換
  let replaced = text
    .replace(/<([a-zA-Z0-9]+)(\s[^>]*)?>[\s\S]*?<\/\1>/g, (_, tag) => `[${tag}]`)
    .replace(/<([a-zA-Z0-9]+)(\s[^>]*)?\/>/g, (_, tag) => `[${tag}]`)
    .replace(/<([a-zA-Z0-9]+)(\s[^>]*)?>/g, (_, tag) => `[${tag}]`);
  // マークダウン画像・リンク・コード・見出し・リスト等を除去または要素名化
  replaced = replaced
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[image]') // 画像
    .replace(/\[[^\]]*\]\([^)]*\)/g, '[link]') // リンク
    .replace(/`[^`]+`/g, '[code]') // インラインコード
    .replace(/^\s{0,3}#+\s.*$/gm, '[heading]') // 見出し
    .replace(/^\s*[-*+]\s+/gm, '[list] ') // 箇条書き
    .replace(/^\s*\d+\.\s+/gm, '[list] ') // 番号付きリスト
    .replace(/>\s?.*$/gm, '[quote]') // 引用
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 太字
    .replace(/\*([^*]+)\*/g, '$1') // イタリック
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1') // アンダーライン
    .replace(/~~([^~]+)~~/g, '$1') // 打ち消し
    .replace(/\n{2,}/g, '\n'); // 連続改行を1つに
  // 残りのマークアップ記号を除去
  replaced = replaced.replace(/[#>*_`~[\]()\-+!]/g, '');
  return replaced.trim();
}

import Link from 'next/link';
import { Post } from '@/app/lib/core/types';

export interface PostListActionProps {
  onDelete?: (postId: string, permanent?: boolean) => void;
  onRestore?: (postId: string) => void;
  onBulkDelete?: (postIds: string[], permanent?: boolean) => void;
  onBulkRestore?: (postIds: string[]) => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

export type PostListVariant = 'default' | 'card';

interface PostListProps extends PostListActionProps {
  posts: Post[];
  filter?: 'all' | 'published' | 'deleted';
  variant?: PostListVariant;
  enableBulkActions?: boolean;
}

const PostList: React.FC<PostListProps> = ({ 
  posts, 
  filter = 'all', 
  onDelete, 
  onRestore, 
  onBulkDelete,
  onBulkRestore,
  showActions = false, 
  isAdmin = false, 
  variant = 'default',
  enableBulkActions = false
}) => {
  console.log('PostList コンポーネント: 受け取った投稿数 =', posts.length);
  console.log('PostList コンポーネント: 投稿データ =', posts);
  
  const [selectedPosts, setSelectedPosts] = React.useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = React.useState(false);

  const filteredPosts = posts.filter(post => {
    switch (filter) {
      case 'published':
        return !post.isDeleted;
      case 'deleted':
        return post.isDeleted;
      default:
        return true;
    }
  });
  
  console.log('PostList コンポーネント: フィルター後の投稿数 =', filteredPosts.length);

  // 全て選択/全て解除
  const handleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map(post => post.id));
    }
  };

  // 個別選択の切り替え
  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  // 一括削除
  const handleBulkDelete = (permanent = false) => {
    if (selectedPosts.length === 0) return;
    
    const message = permanent 
      ? `選択した ${selectedPosts.length} 件の投稿を完全に削除しますか？この操作は取り消せません。`
      : `選択した ${selectedPosts.length} 件の投稿を削除しますか？`;
    
    if (confirm(message)) {
      onBulkDelete?.(selectedPosts, permanent);
      setSelectedPosts([]);
      setShowBulkActions(false);
    }
  };

  // 一括復元
  const handleBulkRestore = () => {
    if (selectedPosts.length === 0) return;
    
    if (confirm(`選択した ${selectedPosts.length} 件の投稿を復元しますか？`)) {
      onBulkRestore?.(selectedPosts);
      setSelectedPosts([]);
      setShowBulkActions(false);
    }
  };

  // 選択状態をリセット（フィルター変更時）
  React.useEffect(() => {
    setSelectedPosts([]);
    setShowBulkActions(false);
  }, [filter]);

  // 選択状態に応じてバルクアクションの表示切り替え
  React.useEffect(() => {
    setShowBulkActions(selectedPosts.length > 0);
  }, [selectedPosts]);

  const selectedPublishedCount = selectedPosts.filter(id => 
    filteredPosts.find(post => post.id === id && !post.isDeleted)
  ).length;
  
  const selectedDeletedCount = selectedPosts.filter(id =>
    filteredPosts.find(post => post.id === id && post.isDeleted)
  ).length;

  if (filteredPosts.length === 0) {
    return <p className="p-4 text-gray-500">投稿がありません</p>;
  }

  // バルクアクションバー
  const BulkActionBar = () => (
    showBulkActions && enableBulkActions && isAdmin && (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 mb-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedPosts.length} 件の投稿を選択中
          </span>
          <div className="flex space-x-2">
            {selectedDeletedCount > 0 && (
              <button
                onClick={handleBulkRestore}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
              >
                選択した投稿を復元 ({selectedDeletedCount})
              </button>
            )}
            {selectedPublishedCount > 0 && (
              <button
                onClick={() => handleBulkDelete(false)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
              >
                選択した投稿を削除 ({selectedPublishedCount})
              </button>
            )}
            {selectedDeletedCount > 0 && (
              <button
                onClick={() => handleBulkDelete(true)}
                className="bg-red-800 hover:bg-red-900 text-white text-xs px-3 py-1 rounded"
              >
                完全削除 ({selectedDeletedCount})
              </button>
            )}
            <button
              onClick={() => {
                setSelectedPosts([]);
                setShowBulkActions(false);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded"
            >
              選択解除
            </button>
          </div>
        </div>
      </div>
    )
  );

  if (variant === 'card') {
    return (
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 bg-transparent">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className={`relative flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-800/60 dark:from-[#181c20]/90 dark:to-[#23272f]/80 shadow-lg hover:shadow-xl transition-all duration-200 p-7 group ${post.isDeleted ? 'opacity-60 grayscale' : ''}`}
          >
            <Link href={`/articles/${post.slug}`} className="absolute inset-0 z-0" tabIndex={-1} aria-label={post.title} />
            <h2 className="text-2xl font-bold text-white group-hover:text-sky-300 mb-2 transition-colors drop-shadow">
              {post.title}
              {post.isDeleted && <span className="ml-2 text-red-400 text-base">(削除済み)</span>}
            </h2>
            <p className="text-sm text-slate-300 mb-3">
              {post.author} ・ {new Date(post.createdAt).toLocaleDateString('ja-JP')}
            </p>
            {post.content && (
              <p className="text-slate-200/90 dark:text-slate-300/80 line-clamp-3 mb-4">
                {(() => {
                  const replaced = summarizeContent(post.content);
                  return replaced.length > 150 ? `${replaced.substring(0, 150)}...` : replaced;
                })()}
              </p>
            )}
            <div className="mt-auto flex justify-end">
              <Link
                href={`/articles/${post.slug}`}
                className="text-sky-400 hover:text-sky-200 dark:text-sky-300 dark:hover:text-white text-sm font-semibold z-10 transition-colors"
              >
                続きを読む →
              </Link>
            </div>
          </article>
        ))}
      </div>
    );
  }

  // 管理画面など従来のリスト
  return (
    <div>
      <BulkActionBar />
      
      {/* 全選択ヘッダー */}
      {enableBulkActions && isAdmin && filteredPosts.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 border-b border-gray-200 dark:border-gray-600">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
              onChange={handleSelectAll}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              すべて選択 ({filteredPosts.length} 件)
            </span>
          </label>
        </div>
      )}
      
      <ul className="divide-y divide-gray-200">
        {filteredPosts.map((post) => (
          <li key={post.id} className={`p-4 ${post.isDeleted ? 'bg-red-50' : ''}`}>
            <div className="flex items-start">
              {/* チェックボックス */}
              {enableBulkActions && isAdmin && (
                <div className="mr-3 mt-1">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={() => handleSelectPost(post.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-medium ${post.isDeleted ? 'line-through text-gray-500' : ''}`}>
                      {post.title}
                      {post.isDeleted && <span className="ml-2 text-red-600">(削除済み)</span>}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      スラッグ: <code className="bg-gray-100 px-1 rounded">{post.slug}</code>
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      投稿者: {post.author} | 作成日: {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                      {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <> | 更新日: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</>
                      )}
                    </p>
                    {post.content && (
                      <p className="text-sm text-gray-700 truncate">
                        {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                      </p>
                    )}
                  </div>
                  {showActions && isAdmin && (
                    <div className="flex flex-col space-y-1 ml-4">
                      {!post.isDeleted ? (
                        <>
                          <Link
                            href={`/articles/${post.slug}`}
                            className="text-blue-600 hover:text-blue-900 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 text-center"
                          >
                            表示
                          </Link>
                          <Link
                            href={`/admin/posts/edit/${post.slug}`}
                            className="text-green-600 hover:text-green-900 text-sm px-2 py-1 border border-green-300 rounded hover:bg-green-50 text-center"
                          >
                            編集
                          </Link>
                          <button
                            onClick={() => onDelete && onDelete(post.id)}
                            className="text-red-600 hover:text-red-900 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                          >
                            削除
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onRestore && onRestore(post.id)}
                            className="text-green-600 hover:text-green-900 text-sm px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                          >
                            復元
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(post.id, true)}
                            className="text-red-800 hover:text-red-900 text-sm px-2 py-1 border border-red-600 rounded hover:bg-red-50"
                          >
                            完全削除
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostList;
