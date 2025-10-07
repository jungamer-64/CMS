// APIエラーコード定義
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// 基本レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ApiErrorCode;
  meta?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

export interface ApiSuccess<T> extends ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError extends ApiResponse<never> {
  success: false;
  error: string;
  code?: ApiErrorCode;
}

// 基本エンティティ型
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'user';
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  author: string;
  authorId: string;
  excerpt?: string;
  published: boolean;
  featured: boolean;
  tags: string[];
  media: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PostInput {
  title: string;
  content: string;
  slug?: string;
  author: string;
  excerpt?: string;
  published?: boolean;
  featured?: boolean;
  tags?: string[];
  media?: string[];
}

export interface PostListParams {
  page?: number;
  limit?: number;
  search?: string;
  author?: string;
  published?: boolean;
  featured?: boolean;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  email: string;
  content: string;
  approved: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentInput {
  postId: string;
  author: string;
  email: string;
  content: string;
  parentId?: string;
}

export interface CommentListParams {
  page?: number;
  limit?: number;
  postId?: string;
  approved?: boolean;
  search?: string;
}

// APIキー関連型
export interface ApiKeyPermissions {
  posts: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  comments: {
    read: boolean;
    create: boolean;
    update: boolean;
    moderate: boolean;
    delete: boolean;
  };
  users: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  media: {
    read: boolean;
    upload: boolean;
    delete: boolean;
  };
  settings: {
    read: boolean;
    update: boolean;
  };
  uploads: {
    create: boolean;
    read: boolean;
    delete: boolean;
  };
  admin: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key?: string; // 作成時のみ返される
  permissions: ApiKeyPermissions;
  userId: string;
  isActive: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyCreateRequest {
  name: string;
  permissions: ApiKeyPermissions;
  expiresAt?: string;
}

// ユーザー関連型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  isActive?: boolean;
}

// パスワード変更型
export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

// ユーザー更新型
export interface UserUpdateInput {
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
}

// 投稿関連型
export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostResource extends Post {
  readonly status: PostStatus;
}

export interface PostCreateRequest {
  title: string;
  content: string;
  slug: string;
  isPublished?: boolean;
}

export interface PostUpdateRequest {
  title?: string;
  content?: string;
  slug?: string;
  isPublished?: boolean;
}

// コメント関連型
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentCreateRequest {
  content: string;
  postId: string;
}

export interface CommentUpdateRequest {
  content?: string;
  isApproved?: boolean;
}

export interface CommentResponse {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  isApproved: boolean;
  createdAt: Date;
}

// エラー作成ヘルパー関数
export function createApiError(
  message: string,
  code: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR
): ApiError {
  return {
    success: false,
    error: message,
    code
  };
}

// 成功レスポンス作成ヘルパー関数
export function createApiSuccess<T>(data: T, message?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(message && { message })
  };
}

// 特別なAPIレスポンス型
export interface UserSessionInfo {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: 'admin' | 'user';
  readonly isActive: boolean;
  readonly lastLogin?: Date;
  readonly preferences?: Record<string, unknown>;
}

export interface PostResponse {
  readonly post: Post;
  readonly author?: {
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
  };
  readonly stats?: {
    readonly views: number;
    readonly likes: number;
    readonly comments: number;
  };
}

export interface RegisterRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
}

export interface AuthResponse {
  readonly user: UserSessionInfo;
  readonly token?: string;
  readonly expiresAt?: Date;
}

export interface SettingsUpdateRequest {
  readonly siteName?: string;
  readonly siteDescription?: string;
  readonly adminEmail?: string;
  readonly allowRegistration?: boolean;
  readonly theme?: string;
}

export interface ThemeUpdateRequest {
  readonly darkMode: boolean;
}

export interface ThemeResponse {
  readonly darkMode: boolean;
  readonly theme?: string;
}

// バリデーションスキーマ型
export interface ValidationSchema {
  readonly required?: readonly string[];
  readonly optional?: readonly string[];
  readonly rules?: Record<string, unknown>;
}

// ページネーション結果型
export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

// ホームページエンティティ
export interface HomePage {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly components: readonly LayoutComponent[];
  readonly styles: GlobalStyles;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface HomePageInput {
  readonly title?: string;
  readonly content?: string;
  readonly components?: readonly LayoutComponentInput[];
  readonly styles?: GlobalStylesInput;
  readonly isActive?: boolean;
}

// グローバルスタイル型
export interface GlobalStyles {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly darkMode: boolean;
  readonly variables?: Record<string, string>;
  readonly customCss?: string;
  readonly colorScheme: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
    readonly text: string;
  };
  readonly typography: {
    readonly fontFamily: string;
    readonly fontSize: {
      readonly base: string;
      readonly heading?: string;
      readonly small: string;
    };
  };
  readonly spacing: {
    readonly containerMaxWidth: string;
  };
  readonly layout: {
    readonly maxWidth?: string;
    readonly spacing: string;
    readonly borderRadius: string;
  };
}

export interface GlobalStylesInput {
  readonly name?: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly fontFamily?: string;
  readonly fontSize?: string;
  readonly darkMode?: boolean;
  readonly isActive?: boolean;
  readonly variables?: Record<string, string>;
  readonly customCss?: string;
  readonly colorScheme?: {
    readonly primary?: string;
    readonly secondary?: string;
    readonly accent?: string;
    readonly background?: string;
    readonly text?: string;
  };
  readonly typography?: {
    readonly fontFamily?: string;
    readonly fontSize?: {
      readonly base?: string;
      readonly heading?: string;
      readonly small?: string;
    };
  };
  readonly spacing?: {
    readonly containerMaxWidth?: string;
    readonly maxWidth?: string;
  };
  readonly layout?: {
    readonly maxWidth?: string;
    readonly spacing?: string;
    readonly borderRadius?: string;
  };
}

// レイアウトコンポーネント型
export interface LayoutComponent {
  readonly id: string;
  readonly type: string;
  readonly content: string;
  readonly isActive: boolean;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LayoutComponentInput {
  readonly id?: string;
  readonly type: string;
  readonly content: Record<string, unknown>;
  readonly isActive?: boolean;
  readonly order?: number;
}
