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
import { Post } from '@/app/lib/types';

export interface PostListActionProps {
  onDelete?: (postId: string, permanent?: boolean) => void;
  onRestore?: (postId: string) => void;
  showActions?: boolean;
  isAdmin?: boolean;
}


export type PostListVariant = 'default' | 'card';

interface PostListProps extends PostListActionProps {
  posts: Post[];
  filter?: 'all' | 'published' | 'deleted';
  variant?: PostListVariant;
}

const PostList: React.FC<PostListProps> = ({ posts, filter = 'all', onDelete, onRestore, showActions = false, isAdmin = false, variant = 'default' }) => {
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

  if (filteredPosts.length === 0) {
    return <p className="p-4 text-gray-500">投稿がありません</p>;
  }

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
    <ul className="divide-y divide-gray-200">
      {filteredPosts.map((post) => (
        <li key={post.id} className={`p-4 ${post.isDeleted ? 'bg-red-50' : ''}`}>
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
                      href={`/admin/edit/${post.slug}`}
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
        </li>
      ))}
    </ul>
  );
};

export default PostList;
