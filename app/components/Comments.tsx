'use client';

import { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/app/lib/core/types';

interface CommentsProps {
  readonly postSlug: string;
}

interface CommentFormData {
  authorName: string;
  authorEmail: string;
  content: string;
}

export default function Comments({ postSlug }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [allowComments, setAllowComments] = useState<boolean | null>(null); // nullで初期化
  const [settingsLoaded, setSettingsLoaded] = useState(false); // 設定読み込み状態
  const [settingsError, setSettingsError] = useState<string | null>(null); // 設定エラー状態
  const [formData, setFormData] = useState<CommentFormData>({
    authorName: '',
    authorEmail: '',
    content: ''
  });

  // 設定を確認
  const checkSettings = async () => {
    try {
      const response = await fetch('/api/settings/public');
      
      if (!response.ok) {
        const errorMsg = `設定API エラー: ${response.status} ${response.statusText}`;
        console.warn(errorMsg);
        setSettingsError(errorMsg);
        setAllowComments(true); // フォールバック
        setSettingsLoaded(true); // 必ず設定を完了する
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.settings) {
        const settings = data.data.settings;
        const allowCommentsValue = settings.enableComments !== false;
        setAllowComments(allowCommentsValue);
        setSettingsError(null);
      } else if (data.settings) {
        // 直接settingsオブジェクトが返される場合
        const allowCommentsValue = data.settings.enableComments !== false;
        setAllowComments(allowCommentsValue);
        setSettingsError(null);
      } else {
        console.warn('設定データの形式が予期しないものです:', data);
        setAllowComments(true); // フォールバック
        setSettingsError('設定の読み込みに一部失敗しました');
      }
      setSettingsLoaded(true);
    } catch (error) {
      console.error('設定確認エラー:', error);
      const errorMsg = error instanceof Error ? error.message : '不明なエラー';
      setSettingsError(errorMsg);
      setAllowComments(true); // フォールバック
      setSettingsLoaded(true); // エラー時も設定完了を通知
    }
  };

  // コメントを読み込む
  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?postSlug=${encodeURIComponent(postSlug)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('取得したコメントデータ:', data);
      
      if (data.success) {
        const commentsData = Array.isArray(data.data) ? data.data : data.comments;
        setComments(commentsData || []);
      } else {
        throw new Error(data.error || 'コメントの読み込みに失敗しました');
      }
    } catch (error) {
      console.error('コメント読み込みエラー:', error);
      throw error; // エラーを再スローして上位でキャッチできるように
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  useEffect(() => {
    // 設定とコメントを並行して読み込む
    const initializeComments = async () => {
      try {
        await Promise.all([
          checkSettings(),
          loadComments()
        ]);
      } catch (error) {
        console.error('コメント初期化エラー:', error);
        // エラーの場合はデフォルトでコメントを許可
        setAllowComments(true);
        setSettingsLoaded(true);
      }
    };
    
    initializeComments();
  }, [postSlug, loadComments]);

  useEffect(() => {
        if (settingsLoaded && allowComments) {
            console.log('コメントデータ:', comments);
        }
    }, [settingsLoaded, allowComments, comments]);

  // 開発環境でのみ表示するログを制限
  if (process.env.NODE_ENV === 'development') {
    console.log('コメントコンポーネント レンダリング:', { 
      settingsLoaded, 
      allowComments, 
      loading, 
      commentsCount: comments.length 
    });
  }

  // 設定が読み込まれていない場合は何も表示しない
  if (!settingsLoaded) {
    return null;
  }

  // コメント機能が無効の場合は何も表示しない
  if (allowComments === false) {
    return null;
  }

  // 設定エラーがある場合はエラーメッセージを表示
  if (settingsError) {
    return (
      <div className="mt-12 border-t pt-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            コメント機能の設定を読み込めませんでした。ページを再読み込みしてください。
          </p>
          <p className="text-sm text-yellow-600 mt-1">エラー: {settingsError}</p>
        </div>
      </div>
    );
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postSlug,
          content: formData.content,
          author: {
            name: formData.authorName,
            email: formData.authorEmail
          }
        })
      });
      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setFormData({ authorName: '', authorEmail: '', content: '' });
        
        // コメントを常に再読み込み
        await loadComments();
      } else {
        setMessage(data.error || 'コメントの投稿に失敗しました');
        setMessageType('error');
      }
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      setMessage('コメントの投稿に失敗しました');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  // 入力変更処理
  const handleInputChange = (field: keyof CommentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-bold mb-6 text-gray-900">コメント ({comments.filter(comment => comment.isApproved && !comment.isDeleted).length})</h3>
      
      {/* コメント一覧 */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">コメントを読み込み中...</p>
        </div>
      ) : (
        <>
          {comments.filter(comment => comment.isApproved && !comment.isDeleted).length > 0 ? (
            <div className="space-y-6 mb-8">
              {comments.filter(comment => comment.isApproved && !comment.isDeleted).map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{comment.authorName}</h4>
                    <time className="text-sm text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 mb-8">まだコメントはありません。最初のコメントを投稿してみませんか？</p>
          )}
        </>
      )}

      {/* コメント投稿フォーム */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold mb-4 text-gray-900">コメントを投稿</h4>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="authorName" className="block text-sm font-medium text-gray-900 mb-1">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="authorName"
                value={formData.authorName}
                onChange={(e) => handleInputChange('authorName', e.target.value)}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="お名前を入力してください"
              />
            </div>
            
            <div>
              <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-900 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="authorEmail"
                value={formData.authorEmail}
                onChange={(e) => handleInputChange('authorEmail', e.target.value)}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="メールアドレスを入力してください"
              />
              <p className="text-xs text-gray-500 mt-1">メールアドレスは公開されません</p>
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-1">
              コメント <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              required
              disabled={submitting}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="コメントを入力してください"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {submitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                投稿中...
              </span>
            ) : (
              'コメントを投稿'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
