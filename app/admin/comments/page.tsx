'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { Comment } from '@/app/lib/core/types';
import type { ApiResponse } from '@/app/lib/core/types/response-types';
import { isApiSuccess } from '@/app/lib/core/utils/type-guards';

type FilterType = 'all' | 'pending' | 'approved';

// 型安全性のための追加の型定義
type CommentCounts = {
  all: number;
  pending: number;
  approved: number;
};

type LoadingState = {
  isLoading: boolean;
  isApproving: string | null;
  isDeleting: string | null;
};

const LoadingSpinner = memo<React.ComponentProps<'div'>>(({ className = '' }) => (
  <div className={`text-center py-8 ${className}`}>
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500 mx-auto"></div>
    <p className="mt-4 text-gray-600 dark:text-gray-400">コメントを読み込み中...</p>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

type FilterButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'success';
  disabled?: boolean;
};

const FilterButton = memo<FilterButtonProps>(({ 
  isActive, 
  onClick, 
  children, 
  variant = 'default',
  disabled = false 
}) => {
  const getActiveColor = useCallback(() => {
    switch (variant) {
      case 'warning': return 'bg-yellow-600 dark:bg-yellow-700 text-white';
      case 'success': return 'bg-green-600 dark:bg-green-700 text-white';
      default: return 'bg-slate-600 dark:bg-slate-700 text-white';
    }
  }, [variant]);

  const activeColor = getActiveColor();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive 
          ? activeColor
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
});
FilterButton.displayName = 'FilterButton';

type CommentFiltersProps = {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  comments: Comment[];
  loading?: boolean;
};

const CommentFilters = memo<CommentFiltersProps>(({ 
  currentFilter, 
  onFilterChange, 
  comments,
  loading = false
}) => {
  const counts = useMemo<CommentCounts>(() => {
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
  }, [comments]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    onFilterChange(filter);
  }, [onFilterChange]);

  return (
    <div className="flex space-x-2">
      <FilterButton
        isActive={currentFilter === 'all'}
        onClick={() => handleFilterChange('all')}
        disabled={loading}
      >
        すべて ({counts.all})
      </FilterButton>
      <FilterButton
        isActive={currentFilter === 'pending'}
        onClick={() => handleFilterChange('pending')}
        variant="warning"
        disabled={loading}
      >
        承認待ち ({counts.pending})
      </FilterButton>
      <FilterButton
        isActive={currentFilter === 'approved'}
        onClick={() => handleFilterChange('approved')}
        variant="success"
        disabled={loading}
      >
        承認済み ({counts.approved})
      </FilterButton>
    </div>
  );
});
CommentFilters.displayName = 'CommentFilters';

const CommentStatus = memo<{ isApproved: boolean | undefined }>(({ isApproved }) => {
  const approved = Boolean(isApproved);
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      approved 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    }`}>
      {approved ? '承認済み' : '承認待ち'}
    </span>
  );
});
CommentStatus.displayName = 'CommentStatus';

type CommentActionsProps = {
  comment: Comment;
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loadingState: LoadingState;
};

const CommentActions = memo<CommentActionsProps>(({ 
  comment, 
  onApprove, 
  onDelete, 
  loadingState 
}) => {
  const isApproving = loadingState.isApproving === comment.id;
  const isDeleting = loadingState.isDeleting === comment.id;
  const isProcessing = isApproving || isDeleting;

  const handleApprove = useCallback(async () => {
    if (!isProcessing) {
      await onApprove(comment.id);
    }
  }, [onApprove, comment.id, isProcessing]);

  const handleDelete = useCallback(async () => {
    if (!isProcessing) {
      await onDelete(comment.id);
    }
  }, [onDelete, comment.id, isProcessing]);

  return (
    <div className="flex space-x-2">
      {!comment.isApproved && (
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded text-sm hover:bg-green-700 dark:hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApproving ? '承認中...' : '承認'}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isProcessing}
        className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded text-sm hover:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? '削除中...' : '削除'}
      </button>
    </div>
  );
});
CommentActions.displayName = 'CommentActions';

type CommentCardProps = {
  comment: Comment;
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loadingState: LoadingState;
};

const CommentCard = memo<CommentCardProps>(({ 
  comment, 
  onApprove, 
  onDelete, 
  loadingState 
}) => {
  const formattedDate = useMemo(() => {
    return new Date(comment.createdAt).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [comment.createdAt]);

  return (
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
            {formattedDate}
          </time>
        </div>
        
        <CommentActions 
          comment={comment} 
          onApprove={onApprove} 
          onDelete={onDelete}
          loadingState={loadingState}
        />
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
});
CommentCard.displayName = 'CommentCard';

const EmptyState = memo<{ filter: FilterType }>(({ filter }) => {
  const message = useMemo(() => {
    switch (filter) {
      case 'pending': return '承認待ちのコメントはありません。';
      case 'approved': return '承認済みのコメントはありません。';
      default: return 'コメントがありません。';
    }
  }, [filter]);

  return (
    <div className="text-center py-8">
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
});
EmptyState.displayName = 'EmptyState';

type CommentsListProps = {
  comments: Comment[];
  filter: FilterType;
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loadingState: LoadingState;
};

const CommentsList = memo<CommentsListProps>(({ 
  comments, 
  filter, 
  onApprove, 
  onDelete, 
  loadingState 
}) => {
  const filteredComments = useMemo(() => {
    return comments.filter(comment => {
      if (filter === 'pending') return !comment.isApproved && !comment.isDeleted;
      if (filter === 'approved') return comment.isApproved && !comment.isDeleted;
      return !comment.isDeleted;
    });
  }, [comments, filter]);

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
          loadingState={loadingState}
        />
      ))}
    </div>
  );
});
CommentsList.displayName = 'CommentsList';


const CommentsManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isApproving: null,
    isDeleting: null,
  });

  const loadComments = useCallback(async (): Promise<void> => {
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true }));
      setError('');
      console.log('🔄 管理画面: コメント読み込み開始');
      const response = await fetch('/api/comments?includeUnapproved=true', {
        credentials: 'include'
      });
      console.log('📡 レスポンス受信:', { status: response.status, ok: response.ok });
      const data: ApiResponse<Comment[]> = await response.json();
      console.log('📋 受信データ:', data);
      
      if (!response.ok || !isApiSuccess(data)) {
        console.log('❌ エラー条件:', { responseOk: response.ok, isApiSuccess: isApiSuccess(data) });
        setComments([]);
        setError(data && 'error' in data ? data.error : 'コメントの読み込みに失敗しました');
        return;
      }
      console.log('✅ データ正常受信:', { dataLength: Array.isArray(data.data) ? data.data.length : 'not array' });
      console.log('管理画面コメントデータ:', data);
      setComments(Array.isArray(data.data) ? data.data : []);
    } catch (err: unknown) {
      console.error('💥 loadComments catch エラー:', err instanceof Error ? err : String(err));
      setComments([]);
      setError(err instanceof Error ? err.message : 'コメントの読み込みに失敗しました');
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const approveComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      setLoadingState(prev => ({ ...prev, isApproving: commentId }));
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isApproved: true }),
      });
      const data = await response.json();
      if (response.ok && isApiSuccess(data)) {
        await loadComments();
      } else {
        setError(data && 'error' in data ? data.error : 'コメントの承認に失敗しました');
      }
    } catch (err: unknown) {
      console.error('コメント承認エラー:', err instanceof Error ? err : String(err));
      setError('コメントの承認に失敗しました');
    } finally {
      setLoadingState(prev => ({ ...prev, isApproving: null }));
    }
  }, [loadComments]);

  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    if (!confirm('このコメントを削除しますか？')) {
      return;
    }
    try {
      setLoadingState(prev => ({ ...prev, isDeleting: commentId }));
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await loadComments();
      } else {
        setError('コメントの削除に失敗しました');
      }
    } catch (err: unknown) {
      console.error('コメント削除エラー:', err instanceof Error ? err : String(err));
      setError('コメントの削除に失敗しました');
    } finally {
      setLoadingState(prev => ({ ...prev, isDeleting: null }));
    }
  }, [loadComments]);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  const content = useMemo(() => {
    if (loadingState.isLoading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadComments}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
        </div>
      );
    }
    return (
      <CommentsList
        comments={comments}
        filter={filter}
        onApprove={approveComment}
        onDelete={deleteComment}
        loadingState={loadingState}
      />
    );
  }, [loadingState, error, comments, filter, approveComment, deleteComment, loadComments]);

  return (
    <AdminLayout title="コメント管理">
      <div className="h-full p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">コメント管理</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">投稿に対するコメントの承認・削除管理</p>
            </div>
            <div className="flex items-center space-x-2">
              <CommentFilters
                currentFilter={filter}
                onFilterChange={handleFilterChange}
                comments={comments}
                loading={loadingState.isLoading}
              />
              <button
                type="button"
                onClick={loadComments}
                disabled={loadingState.isLoading}
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                title="最新のコメント情報を再読み込み"
              >
                {loadingState.isLoading ? 'リロード中...' : 'リロード'}
              </button>
            </div>
          </div>
          {content}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CommentsManagement;
