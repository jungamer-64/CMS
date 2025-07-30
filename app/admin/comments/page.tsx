'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/lib/AdminLayout';
import { Comment } from '@/app/lib/types';

export default function CommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // コメント一覧を読み込む
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/comments');
      const data = await response.json();
      
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('コメント読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  // コメントを承認
  const approveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error('コメント承認エラー:', error);
    }
  };

  // コメントを削除
  const deleteComment = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error('コメント削除エラー:', error);
    }
  };

  // フィルタリングされたコメント
  const filteredComments = comments.filter(comment => {
    if (filter === 'pending') return !comment.isApproved && !comment.isDeleted;
    if (filter === 'approved') return comment.isApproved && !comment.isDeleted;
    return !comment.isDeleted;
  });

  return (
    <AdminLayout title="コメント管理">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">コメント管理</h1>
          
          {/* フィルター */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              すべて ({comments.filter(c => !c.isDeleted).length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              承認待ち ({comments.filter(c => !c.isApproved && !c.isDeleted).length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded ${
                filter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              承認済み ({comments.filter(c => c.isApproved && !c.isDeleted).length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">コメントを読み込み中...</p>
          </div>
        ) : (
          <>
            {filteredComments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {filter === 'all' && 'コメントがありません。'}
                  {filter === 'pending' && '承認待ちのコメントはありません。'}
                  {filter === 'approved' && '承認済みのコメントはありません。'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold text-lg">{comment.authorName}</h3>
                          <span className="text-sm text-gray-500">{comment.authorEmail}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            comment.isApproved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {comment.isApproved ? '承認済み' : '承認待ち'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          投稿: <span className="font-medium">{comment.postSlug}</span>
                        </p>
                        <time className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!comment.isApproved && (
                          <button
                            onClick={() => approveComment(comment.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            承認
                          </button>
                        )}
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
