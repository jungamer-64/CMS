/**
 * フォーマッター関数
 * 
 * データを適切な形式に変換するための関数群を提供します。
 * 表示用、API応答用、ログ出力用などの様々な形式に対応します。
 */

import type {
  ApiSuccess,
  ApiError,
  PaginationMeta,
  Post,
  User,
  Comment,
  MediaFile,
} from '../types';

// ============================================================================
// 日付フォーマッター
// ============================================================================

/**
 * 日付をISO文字列に変換
 */
export function formatToISOString(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * 日付を日本語形式に変換
 */
export function formatToJapaneseDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 相対時間形式に変換
 */
export function formatToRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 30) {
    return `${diffDays}日前`;
  } else {
    return formatToJapaneseDate(dateObj);
  }
}

// ============================================================================
// ファイルサイズフォーマッター
// ============================================================================

/**
 * バイト数を人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// ============================================================================
// 文字列フォーマッター
// ============================================================================

/**
 * 文字列を指定長で切り詰め
 */
export function truncateString(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * スラッグ形式に変換
 */
export function formatToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 英数字、空白、ハイフン以外を削除
    .replace(/[\s_-]+/g, '-') // 空白やアンダースコアをハイフンに変換
    .replace(/^-+/, '') // 前のハイフンを削除
    .replace(/-+$/, ''); // 後のハイフンを削除
}

/**
 * キャメルケースをケバブケースに変換
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * ケバブケースをキャメルケースに変換
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// ============================================================================
// APIレスポンスフォーマッター
// ============================================================================

/**
 * 成功レスポンスを作成
 */
export function formatSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Partial<PaginationMeta>
): ApiSuccess<T> {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && {
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    }),
  };

  return response;
}

/**
 * エラーレスポンスを作成
 */
export function formatErrorResponse(
  error: string,
  code?: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    success: false,
    error,
    ...(code && { code: code as ApiError['code'] }),
    ...(details && { details }),
  };
}

/**
 * ページネーション情報を作成
 */
export function formatPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================================================
// エンティティフォーマッター
// ============================================================================

/**
 * 投稿を公開用形式に変換
 */
export function formatPostForPublic(post: Post): Omit<Post, '_id'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...publicPost } = post;
  return {
    ...publicPost,
    createdAt: new Date(post.createdAt),
    updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
  };
}

/**
 * ユーザーを公開用形式に変換（機密情報を除外）
 */
export function formatUserForPublic(user: User): Omit<User, '_id' | 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, passwordHash, ...publicUser } = user;
  return {
    ...publicUser,
    createdAt: new Date(user.createdAt),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
  };
}

/**
 * コメントを公開用形式に変換
 */
export function formatCommentForPublic(comment: Comment): Omit<Comment, '_id'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...publicComment } = comment;
  return {
    ...publicComment,
    createdAt: new Date(comment.createdAt),
    updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : undefined,
  };
}

/**
 * メディアファイルを公開用形式に変換
 */
export function formatMediaFileForPublic(media: MediaFile): Omit<MediaFile, '_id'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...publicMedia } = media;
  return {
    ...publicMedia,
    createdAt: new Date(media.createdAt),
    updatedAt: media.updatedAt ? new Date(media.updatedAt) : undefined,
  };
}

// ============================================================================
// リスト形式フォーマッター
// ============================================================================

/**
 * エンティティリストをページネーション付きで形式化
 */
export function formatEntityList<T, U>(
  entities: T[],
  formatter: (entity: T) => U,
  pagination: PaginationMeta
): ApiSuccess<{ items: U[]; pagination: PaginationMeta }> {
  return formatSuccessResponse({
    items: entities.map(formatter),
    pagination,
  });
}

/**
 * 検索結果を形式化
 */
export function formatSearchResults<T>(
  results: T[],
  query: string,
  pagination: PaginationMeta
): ApiSuccess<{ results: T[]; query: string; pagination: PaginationMeta }> {
  return formatSuccessResponse({
    results,
    query,
    pagination,
  });
}

// ============================================================================
// バリデーションエラーフォーマッター
// ============================================================================

/**
 * バリデーションエラーをAPIエラー形式に変換
 */
export function formatValidationErrors(
  errors: Array<{ field: string; message: string }>
): ApiError {
  const fieldErrors = errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field].push(error.message);
    return acc;
  }, {} as Record<string, string[]>);

  return formatErrorResponse(
    'バリデーションエラーが発生しました',
    'VALIDATION_ERROR',
    { fieldErrors }
  );
}

// ============================================================================
// URL・パスフォーマッター
// ============================================================================

/**
 * ベースURLとパスを結合
 */
export function joinUrlPath(baseUrl: string, ...paths: string[]): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPaths = paths
    .filter(Boolean)
    .map(path => path.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter(Boolean);

  if (cleanPaths.length === 0) {
    return cleanBase;
  }

  return `${cleanBase}/${cleanPaths.join('/')}`;
}

/**
 * クエリパラメータをURL文字列に変換
 */
export function formatQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && value !== null) {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
