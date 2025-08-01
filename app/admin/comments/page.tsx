'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/lib/AdminLayout';
import { Comment } from '@/app/lib/types';
import type { ApiResponse, CommentsListResponse } from '@/app/lib/api-types';
import { isApiSuccess } from '@/app/lib/api-types';

type FilterType = 'all' | 'pending' | 'approved';

const LoadingSpinner: React.FC = () => (
  <div className="text-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500 mx-auto"></div>
    <p className="mt-4 text-gray-600 dark:text-gray-400">コメントを読み込み中...</p>
  </div>
);

type FilterButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'success';
};
const FilterButton: React.FC<FilterButtonProps> = ({ isActive, onClick, children, variant = 'default' }) => {
  const getActiveColor = () => {
    switch (variant) {
      case 'warning': return 'bg-yellow-600 dark:bg-yellow-700 text-white';
      case 'success': return 'bg-green-600 dark:bg-green-700 text-white';
      default: return 'bg-slate-600 dark:bg-slate-700 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded transition-colors ${
        isActive 
          ? getActiveColor()
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
};

type CommentFiltersProps = {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  comments: Comment[];
};
const CommentFilters: React.FC<CommentFiltersProps> = ({ currentFilter, onFilterChange, comments }) => {
  const getCounts = () => {
    // commentsが未定義またはnullの場合はデフォルト値を返す
    if (!comments || !Array.isArray(comments)) {
      return {
        all: 0,
        pending: 0,
        approved: 0,
      };
    }
    
    return {
      all: comments.filter(c => !c.isDeleted).length,
      pending: comments.filter(c => !c.isApproved && !c.isDeleted).length,
      approved: comments.filter(c => c.isApproved && !c.isDeleted).length,
    };
  };

  const counts = getCounts();

  return (
    <div className="flex space-x-2">
      <FilterButton
        isActive={currentFilter === 'all'}
        onClick={() => onFilterChange('all')}
      >
        すべて ({counts.all})
      </FilterButton>
      <FilterButton
        isActive={currentFilter === 'pending'}
        onClick={() => onFilterChange('pending')}
        variant="warning"
      >
        承認待ち ({counts.pending})
      </FilterButton>
      <FilterButton
        isActive={currentFilter === 'approved'}
        onClick={() => onFilterChange('approved')}
        variant="success"
      >
        承認済み ({counts.approved})
      </FilterButton>
    </div>
  );
};

const CommentStatus: React.FC<{ isApproved: boolean }> = ({ isApproved }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${
    isApproved 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
  }`}>
    {isApproved ? '承認済み' : '承認待ち'}
  </span>
);

type CommentActionsProps = {
  comment: Comment;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
};
const CommentActions: React.FC<CommentActionsProps> = ({ comment, onApprove, onDelete }) => (
  <div className="flex space-x-2">
    {!comment.isApproved && (
      <button
        onClick={() => onApprove(comment.id)}
        className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded text-sm hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
      >
        承認
      </button>
    )}
    <button
      onClick={() => onDelete(comment.id)}
      className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
    >
      削除
    </button>
  </div>
);

type CommentCardProps = {
  comment: Comment;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
};
const CommentCard: React.FC<CommentCardProps> = ({ comment, onApprove, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="flex items-center space-x-4 mb-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{comment.authorName}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{comment.authorEmail}</span>
          <CommentStatus isApproved={comment.isApproved} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          投稿: <span className="font-medium">{comment.postSlug}</span>
        </p>
        <time className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(comment.createdAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </time>
      </div>
      
      <CommentActions 
        comment={comment} 
        onApprove={onApprove} 
        onDelete={onDelete} 
      />
    </div>
    
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{comment.content}</p>
    </div>
  </div>
);

const EmptyState: React.FC<{ filter: FilterType }> = ({ filter }) => {
  const getMessage = () => {
    switch (filter) {
      case 'pending': return '承認待ちのコメントはありません。';
      case 'approved': return '承認済みのコメントはありません。';
      default: return 'コメントがありません。';
    }
  };

  return (
    <div className="text-center py-8">
      <p className="text-gray-600 dark:text-gray-400">{getMessage()}</p>
    </div>
  );
};

type CommentsListProps = {
  comments: Comment[];
  filter: FilterType;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
};
const CommentsList: React.FC<CommentsListProps> = ({ comments, filter, onApprove, onDelete }) => {
  const filteredComments = comments.filter(comment => {
    if (filter === 'pending') return !comment.isApproved && !comment.isDeleted;
    if (filter === 'approved') return comment.isApproved && !comment.isDeleted;
    return !comment.isDeleted;
  });

  if (filteredComments.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className="space-y-4">
      {filteredComments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onApprove={onApprove}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};


const CommentsManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string>('');

  const loadComments = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/comments');
      const data: ApiResponse<CommentsListResponse> = await response.json();
      if (!response.ok || !isApiSuccess(data)) {
        setComments([]);
        setError(data && 'error' in data ? data.error : 'コメントの読み込みに失敗しました');
        return;
      }
      setComments(Array.isArray(data.data.comments) ? data.data.comments : []);
    } catch (error) {
      setComments([]);
      setError(error instanceof Error ? error.message : 'コメントの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const approveComment = async (commentId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error('コメント承認エラー:', error);
    }
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    if (!confirm('このコメントを削除しますか？')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error('コメント削除エラー:', error);
    }
  };

  let content: React.ReactNode;
  if (loading) {
    content = <LoadingSpinner />;
  } else if (error) {
    content = <div className="text-center text-red-600 py-8">{error}</div>;
  } else {
    content = (
      <CommentsList
        comments={comments}
        filter={filter}
        onApprove={approveComment}
        onDelete={deleteComment}
      />
    );
  }

  return (
    <AdminLayout title="コメント管理">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">コメント管理</h1>
          <div className="flex items-center space-x-2">
            <CommentFilters
              currentFilter={filter}
              onFilterChange={setFilter}
              comments={comments}
            />
            <button
              type="button"
              onClick={loadComments}
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              title="最新のコメント情報を再読み込み"
            >
              {loading ? 'リロード中...' : 'リロード'}
            </button>
          </div>
        </div>
        {content}
      </div>
    </AdminLayout>
  );
};

export default CommentsManagement;
