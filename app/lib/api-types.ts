import { NextRequest } from 'next/server';
import { ApiKeyPermissions, Post, User, Comment, ApiKey } from './types';

// =============================================================================
// 基本的なHTTPメソッドの型定義
// =============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// =============================================================================
// APIレスポンスの型定義
// =============================================================================

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =============================================================================
// リクエストの型定義
// =============================================================================

export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface SortableRequest {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchableRequest {
  search?: string;
}

export type BaseListRequest = PaginatedRequest & SortableRequest & SearchableRequest;

// =============================================================================
// 認証関連の型定義
// =============================================================================

export interface AuthenticatedUser {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  email?: string;
  displayName?: string;
}

export interface AuthContext {
  isAuthenticated: boolean;
  authMethod: 'session' | 'apikey';
  user?: AuthenticatedUser;
  apiKey?: {
    userId: string;
    permissions: ApiKeyPermissions;
  };
}

export interface RequiredPermission {
  resource: keyof ApiKeyPermissions;
  action: string;
}

// =============================================================================
// 各エンドポイント専用の型定義
// =============================================================================

// Posts API
export interface PostCreateRequest {
  title: string;
  content: string;
  author: string;
  slug?: string;
}

export interface PostUpdateRequest {
  title?: string;
  content?: string;
  author?: string;
  slug?: string;
}

export interface PostsListRequest extends BaseListRequest {
  type?: 'all' | 'published' | 'deleted';
  author?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
}

export interface PostResponse {
  post: Post;
}

export interface PostsListResponse {
  posts: Post[];
  total: number;
  filters?: PostsListRequest;
}

// Users API
export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
  role?: 'user' | 'admin';
}

export interface UserUpdateRequest {
  displayName?: string;
  email?: string;
  role?: 'user' | 'admin';
  darkMode?: boolean;
}

export interface UsersListRequest extends BaseListRequest {
  role?: 'user' | 'admin';
  isActive?: boolean;
  sortBy?: 'createdAt' | 'username' | 'displayName';
}

export interface UserResponse {
  user: Omit<User, 'passwordHash'>;
}

export interface UsersListResponse {
  users: Omit<User, 'passwordHash'>[];
  total: number;
  filters?: UsersListRequest;
}

// Comments API
export interface CommentCreateRequest {
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
}

export interface CommentUpdateRequest {
  authorName?: string;
  authorEmail?: string;
  content?: string;
  isApproved?: boolean;
}

export interface CommentsListRequest extends BaseListRequest {
  postSlug?: string;
  isApproved?: boolean;
  sortBy?: 'createdAt' | 'authorName';
}

export interface CommentResponse {
  comment: Comment;
}

export interface CommentsListResponse {
  comments: Comment[];
  total: number;
  filters?: CommentsListRequest;
}

// Auth API
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token?: string;
}

// API Keys API
export interface ApiKeyCreateRequest {
  name: string;
  permissions: ApiKeyPermissions;
  expiresAt?: Date;
}

export interface ApiKeyUpdateRequest {
  name?: string;
  permissions?: ApiKeyPermissions;
  isActive?: boolean;
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  apiKey: ApiKey;
}

export interface ApiKeysListResponse {
  apiKeys: ApiKey[];
  hasApiKey: boolean;
  message?: string;
}

// Settings API
export interface SettingsUpdateRequest {
  darkMode?: boolean;
  apiAccess?: boolean;
  emailNotifications?: boolean;
  maintenanceMode?: boolean;
  maxPostsPerPage?: number;
  allowComments?: boolean;
  requireApproval?: boolean;
}

export interface SettingsResponse {
  settings: Record<string, unknown>;
}

// Stats API
export interface StatsResponse {
  totalPosts: number;
  publishedPosts: number;
  deletedPosts: number;
  totalUsers: number;
  totalComments: number;
}

// Upload API
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// =============================================================================
// エラーコードの定義
// =============================================================================

export enum ApiErrorCode {
  // 認証・認可エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  
  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // リソースエラー
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // サーバーエラー
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 外部サービスエラー
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

// =============================================================================
// APIハンドラーの型定義
// =============================================================================

export type ApiHandler<TRequest = unknown, TResponse = unknown> = (
  request: NextRequest,
  context: AuthContext,
  ...args: unknown[]
) => Promise<ApiResponse<TResponse>>;

export type PublicApiHandler<TRequest = unknown, TResponse = unknown> = (
  request: NextRequest,
  ...args: unknown[]
) => Promise<ApiResponse<TResponse>>;

// =============================================================================
// バリデーション用の型定義
// =============================================================================

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// フィルター・ソート用の型定義
// =============================================================================

export interface FilterOptions<T = Record<string, unknown>> {
  where?: Partial<T>;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  select?: Record<string, 1 | 0>;
}

// =============================================================================
// レート制限の型定義
// =============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}
