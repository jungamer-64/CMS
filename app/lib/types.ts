// =============================================================================
// 厳格な型安全設計による高性能型定義ファイル
// =============================================================================

// Re-export modern API types for backward compatibility
export * from './api-types';

// =============================================================================
// 基本データ型（readonly & 厳密な型制約）
// =============================================================================

// ユーザーロール（Union型で厳密に制約）
export type UserRole = 'user' | 'admin';

// ソート順序（Union型で厳密に制約）
export type SortOrder = 'asc' | 'desc';

// 投稿タイプ（Union型で厳密に制約）
export type PostType = 'all' | 'published' | 'deleted';

// ソート可能なフィールド
export type PostSortField = 'createdAt' | 'updatedAt' | 'title';
export type UserSortField = 'createdAt' | 'username' | 'displayName';

// =============================================================================
// Core Entity Types（不変性とパフォーマンスを重視）
// =============================================================================

export interface Post {
  readonly _id?: string;
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly isDeleted?: boolean;
  readonly media?: readonly string[]; // 不変配列
}

export interface PostInput {
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly slug?: string; // オプション（自動生成可能）
  readonly media?: readonly string[]; // 不変配列
}

export interface User {
  readonly _id?: string;
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly displayName: string;
  readonly role: UserRole; // 厳密な型制約
  readonly darkMode?: boolean;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

// =============================================================================
// Input Types（厳密なバリデーション対応）
// =============================================================================

export interface UserInput {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
}

// =============================================================================
// Admin Response Types（高性能キャッシュ対応）
// =============================================================================

export interface AdminPostsResponse {
  readonly success: true;
  readonly data: readonly Post[];
  readonly total: number;
  readonly page?: number;
  readonly limit?: number;
  readonly timestamp?: number; // キャッシュ用タイムスタンプ
}

export interface AdminUsersResponse {
  readonly success: true;
  readonly data: readonly User[];
  readonly total: number;
  readonly page?: number;
  readonly limit?: number;
  readonly timestamp?: number; // キャッシュ用タイムスタンプ
}

export interface AdminStatsResponse {
  readonly success: true;
  readonly data: {
    readonly totalPosts: number;
    readonly publishedPosts: number;
    readonly deletedPosts: number;
    readonly totalUsers: number;
    readonly totalComments: number;
  };
  readonly timestamp?: number; // キャッシュ用タイムスタンプ
}

// =============================================================================
// Pagination and Filter Types（型安全性とパフォーマンス重視）
// =============================================================================

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

// 厳密な型制約でランタイムエラーを防止
export interface PostFilters {
  readonly type: PostType;
  readonly search?: string;
  readonly author?: string;
  readonly sortBy?: PostSortField;
  readonly sortOrder?: SortOrder;
}

export interface UserFilters {
  readonly role?: UserRole;
  readonly search?: string;
  readonly sortBy?: UserSortField;
  readonly sortOrder?: SortOrder;
  readonly isActive?: boolean;
}

// =============================================================================
// Account Management Types（セキュリティと型安全性重視）
// =============================================================================

export interface UserUpdateInput {
  readonly displayName?: string;
  readonly email?: string;
  readonly role?: UserRole;
  readonly darkMode?: boolean;
}

export interface UserCreationInput extends UserInput {
  readonly role?: UserRole;
}

export interface PasswordChangeInput {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface AdminUserManagement {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly darkMode?: boolean;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly lastLoginAt?: Date;
  readonly isActive: boolean;
}

export interface UserSessionInfo {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly darkMode?: boolean;
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
}

// =============================================================================
// Legacy API Types（下位互換性維持）
// =============================================================================

// @deprecated - use api-types.ts instead
export interface ApiError {
  readonly success: false;
  readonly error: string;
  readonly code?: string;
}

// @deprecated - use api-types.ts instead
export type ApiResponse<T> = {
  readonly success: true;
  readonly data: T;
} | ApiError;

// =============================================================================
// Comment Types（コンテンツ管理最適化）
// =============================================================================

export interface Comment {
  readonly _id?: string;
  readonly id: string;
  readonly postSlug: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly content: string;
  readonly isApproved: boolean;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly isDeleted?: boolean;
}

export interface CommentInput {
  readonly postSlug: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly content: string;
}

// =============================================================================
// Security Types（セキュリティ重視設計）
// =============================================================================

export interface PasswordResetToken {
  readonly _id?: string;
  readonly id: string;
  readonly userId: string;
  readonly token: string;
  readonly email: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly used: boolean;
}

// =============================================================================
// API Key Types（権限管理とセキュリティ最適化）
// =============================================================================

export interface ApiKey {
  readonly _id?: string;
  readonly id: string;
  readonly userId: string; // アカウントID
  readonly name: string;
  readonly key: string;
  readonly permissions: ApiKeyPermissions;
  readonly createdAt: Date;
  readonly lastUsed?: Date;
  readonly isActive: boolean;
  readonly expiresAt?: Date;
}

export interface ApiKeyPermissions extends Record<string, Record<string, boolean>> {
  readonly posts: {
    readonly create: boolean;
    readonly read: boolean;
    readonly update: boolean;
    readonly delete: boolean;
  };
  readonly comments: {
    readonly read: boolean;
    readonly moderate: boolean;
    readonly delete: boolean;
  };
  readonly users: {
    readonly read: boolean;
    readonly create: boolean;
    readonly update: boolean;
    readonly delete: boolean;
  };
  readonly settings: {
    readonly read: boolean;
    readonly update: boolean;
  };
  readonly uploads: {
    readonly create: boolean;
    readonly read: boolean;
    readonly delete: boolean;
  };
}

export interface ApiKeyInput {
  readonly name: string;
  readonly permissions: ApiKeyPermissions;
  readonly expiresAt?: Date;
}

export interface ApiKeyResponse {
  readonly success: true;
  readonly data: {
    readonly apiKey: ApiKey;
  };
}

export interface ApiKeysResponse {
  readonly success: true;
  readonly data: {
    readonly apiKeys: readonly ApiKey[];
  };
}

// =============================================================================
// Type Guards（ランタイム型安全性とパフォーマンス向上）
// =============================================================================

export const isUserRole = (value: unknown): value is UserRole => {
  return typeof value === 'string' && (value === 'user' || value === 'admin');
};

export const isSortOrder = (value: unknown): value is SortOrder => {
  return typeof value === 'string' && (value === 'asc' || value === 'desc');
};

export const isPostType = (value: unknown): value is PostType => {
  return typeof value === 'string' && ['all', 'published', 'deleted'].includes(value);
};

export const isPostSortField = (value: unknown): value is PostSortField => {
  return typeof value === 'string' && ['createdAt', 'updatedAt', 'title'].includes(value);
};

export const isUserSortField = (value: unknown): value is UserSortField => {
  return typeof value === 'string' && ['createdAt', 'username', 'displayName'].includes(value);
};

// =============================================================================
// Utility Types（コード再利用性とパフォーマンス向上）
// =============================================================================

// 安全な部分更新型（readonlyを除去）
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// ID フィールドのみ抽出（制約付き）
export type EntityId<T extends { id: string }> = Pick<T, 'id'>;

// 作成日時フィールドのみ抽出（制約付き）
export type EntityTimestamps<T extends { createdAt: Date; updatedAt: Date }> = Pick<T, 'createdAt' | 'updatedAt'>;

// パスワードハッシュを除外したユーザー情報
export type SafeUser = Omit<User, 'passwordHash'>;

// 削除状態を除外した投稿情報
export type ActivePost = Omit<Post, 'isDeleted'>;

// =============================================================================
// Performance-optimized constants（実行時最適化）
// =============================================================================

export const USER_ROLES = ['user', 'admin'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;
export const POST_TYPES = ['all', 'published', 'deleted'] as const;
export const POST_SORT_FIELDS = ['createdAt', 'updatedAt', 'title'] as const;
export const USER_SORT_FIELDS = ['createdAt', 'username', 'displayName'] as const;
