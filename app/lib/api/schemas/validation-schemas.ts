/**
 * 統一 RESTful バリデーションスキーマ
 * 
 * REST API準拠の統一されたバリデーション定義
 * - 厳格な型安全性
 * - 再利用可能なスキーマ
 * - パフォーマンス最適化
 */

// ============================================================================
// 基本バリデーション関数
// ============================================================================

/**
 * 文字列バリデーション
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 非空文字列バリデーション
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 数値バリデーション
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 正の整数バリデーション
 */
function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * ブール値バリデーション
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 配列バリデーション
 */
function isArray<T>(value: unknown, itemValidator?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  if (!itemValidator) return true;
  return value.every(itemValidator);
}

/**
 * オブジェクトバリデーション
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Eメールバリデーション
 */
function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * パスワード強度バリデーション（最低8文字、英数字含む）
 */
function isStrongPassword(value: unknown): value is string {
  if (!isString(value)) return false;
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
}

/**
 * スラッグバリデーション（URL安全文字のみ）
 */
function isSlug(value: unknown): value is string {
  if (!isString(value)) return false;
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(value);
}

/**
 * 列挙値バリデーション
 */
function isOneOf<T extends readonly string[]>(
  value: unknown,
  allowedValues: T
): value is T[number] {
  return isString(value) && (allowedValues as readonly string[]).includes(value);
}

// ============================================================================
// エンティティ固有のバリデーション
// ============================================================================

/**
 * ユーザー作成リクエストバリデーション
 */
export interface UserCreateRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
  readonly role?: 'user' | 'admin';
}

export function isUserCreateRequest(data: unknown): data is UserCreateRequest {
  if (!isObject(data)) return false;
  
  return (
    isNonEmptyString(data.username) &&
    isEmail(data.email) &&
    isStrongPassword(data.password) &&
    (data.displayName === undefined || isNonEmptyString(data.displayName)) &&
    (data.role === undefined || isOneOf(data.role, ['user', 'admin'] as const))
  );
}

/**
 * ユーザー更新リクエストバリデーション
 */
export interface UserUpdateRequest {
  readonly username?: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly role?: 'user' | 'admin';
  readonly isActive?: boolean;
}

export function isUserUpdateRequest(data: unknown): data is UserUpdateRequest {
  if (!isObject(data)) return false;
  
  return (
    (data.username === undefined || isNonEmptyString(data.username)) &&
    (data.email === undefined || isEmail(data.email)) &&
    (data.displayName === undefined || isNonEmptyString(data.displayName)) &&
    (data.role === undefined || isOneOf(data.role, ['user', 'admin'] as const)) &&
    (data.isActive === undefined || isBoolean(data.isActive))
  );
}

/**
 * 投稿作成リクエストバリデーション
 */
export interface PostCreateRequest {
  readonly title: string;
  readonly content: string;
  readonly excerpt?: string;
  readonly status?: 'draft' | 'published';
  readonly tags?: readonly string[];
  readonly metadata?: {
    readonly author_note?: string;
    readonly category?: string;
    readonly featured?: boolean;
  };
}

export function isPostCreateRequest(data: unknown): data is PostCreateRequest {
  if (!isObject(data)) return false;
  
  const isValidMetadata = (meta: unknown) => {
    if (!isObject(meta)) return false;
    return (
      (meta.author_note === undefined || isString(meta.author_note)) &&
      (meta.category === undefined || isString(meta.category)) &&
      (meta.featured === undefined || isBoolean(meta.featured))
    );
  };
  
  return (
    isNonEmptyString(data.title) &&
    isNonEmptyString(data.content) &&
    (data.excerpt === undefined || isString(data.excerpt)) &&
    (data.status === undefined || isOneOf(data.status, ['draft', 'published'] as const)) &&
    (data.tags === undefined || isArray(data.tags, isString)) &&
    (data.metadata === undefined || isValidMetadata(data.metadata))
  );
}

/**
 * 投稿更新リクエストバリデーション
 */
export interface PostUpdateRequest {
  readonly title?: string;
  readonly content?: string;
  readonly excerpt?: string;
  readonly status?: 'draft' | 'published';
  readonly tags?: readonly string[];
  readonly metadata?: {
    readonly author_note?: string;
    readonly category?: string;
    readonly featured?: boolean;
  };
}

export function isPostUpdateRequest(data: unknown): data is PostUpdateRequest {
  if (!isObject(data)) return false;
  
  const isValidMetadata = (meta: unknown) => {
    if (!isObject(meta)) return false;
    return (
      (meta.author_note === undefined || isString(meta.author_note)) &&
      (meta.category === undefined || isString(meta.category)) &&
      (meta.featured === undefined || isBoolean(meta.featured))
    );
  };
  
  return (
    (data.title === undefined || isNonEmptyString(data.title)) &&
    (data.content === undefined || isNonEmptyString(data.content)) &&
    (data.excerpt === undefined || isString(data.excerpt)) &&
    (data.status === undefined || isOneOf(data.status, ['draft', 'published'] as const)) &&
    (data.tags === undefined || isArray(data.tags, isString)) &&
    (data.metadata === undefined || isValidMetadata(data.metadata))
  );
}

/**
 * コメント作成リクエストバリデーション
 */
export interface CommentCreateRequest {
  readonly postId: string;
  readonly content: string;
  readonly authorName?: string;
  readonly authorEmail?: string;
  readonly parentId?: string;
}

export function isCommentCreateRequest(data: unknown): data is CommentCreateRequest {
  if (!isObject(data)) return false;
  
  return (
    isNonEmptyString(data.postId) &&
    isNonEmptyString(data.content) &&
    (data.authorName === undefined || isNonEmptyString(data.authorName)) &&
    (data.authorEmail === undefined || isEmail(data.authorEmail)) &&
    (data.parentId === undefined || isNonEmptyString(data.parentId))
  );
}

/**
 * ログインリクエストバリデーション
 */
export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

export function isLoginRequest(data: unknown): data is LoginRequest {
  if (!isObject(data)) return false;
  
  return (
    isNonEmptyString(data.username) &&
    isNonEmptyString(data.password)
  );
}

/**
 * 設定更新リクエストバリデーション
 */
export interface SettingsUpdateRequest {
  readonly siteName?: string;
  readonly siteDescription?: string;
  readonly enableComments?: boolean;
  readonly postsPerPage?: number;
  readonly theme?: string;
}

export function isSettingsUpdateRequest(data: unknown): data is SettingsUpdateRequest {
  if (!isObject(data)) return false;
  
  return (
    (data.siteName === undefined || isNonEmptyString(data.siteName)) &&
    (data.siteDescription === undefined || isString(data.siteDescription)) &&
    (data.enableComments === undefined || isBoolean(data.enableComments)) &&
    (data.postsPerPage === undefined || isPositiveInteger(data.postsPerPage)) &&
    (data.theme === undefined || isNonEmptyString(data.theme))
  );
}

/**
 * APIキー作成リクエストバリデーション
 */
export interface ApiKeyCreateRequest {
  readonly name: string;
  readonly permissions: {
    readonly posts?: {
      readonly read?: boolean;
      readonly write?: boolean;
      readonly delete?: boolean;
    };
    readonly comments?: {
      readonly read?: boolean;
      readonly moderate?: boolean;
    };
    readonly users?: {
      readonly read?: boolean;
      readonly write?: boolean;
    };
    readonly settings?: {
      readonly read?: boolean;
      readonly write?: boolean;
    };
  };
}

export function isApiKeyCreateRequest(data: unknown): data is ApiKeyCreateRequest {
  if (!isObject(data)) return false;
  
  const isValidPermissions = (perms: unknown) => {
    if (!isObject(perms)) return false;
    
    const isValidResourcePerms = (resourcePerms: unknown) => {
      if (!isObject(resourcePerms)) return false;
      return Object.values(resourcePerms).every(val => val === undefined || isBoolean(val));
    };
    
    return (
      (perms.posts === undefined || isValidResourcePerms(perms.posts)) &&
      (perms.comments === undefined || isValidResourcePerms(perms.comments)) &&
      (perms.users === undefined || isValidResourcePerms(perms.users)) &&
      (perms.settings === undefined || isValidResourcePerms(perms.settings))
    );
  };
  
  return (
    isNonEmptyString(data.name) &&
    isValidPermissions(data.permissions)
  );
}

// ============================================================================
// メディア関連バリデーション
// ============================================================================

/**
 * 許可されたファイル拡張子
 */
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] as const;
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'] as const;
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'] as const;

/**
 * ファイル拡張子バリデーション
 */
function isAllowedFileExtension(
  filename: string,
  allowedExtensions: readonly string[]
): boolean {
  if (!isString(filename)) return false;
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * 画像ファイルバリデーション
 */
function isImageFile(filename: string): boolean {
  return isAllowedFileExtension(filename, ALLOWED_IMAGE_EXTENSIONS);
}

/**
 * 動画ファイルバリデーション
 */
function isVideoFile(filename: string): boolean {
  return isAllowedFileExtension(filename, ALLOWED_VIDEO_EXTENSIONS);
}

// ============================================================================
// エクスポート
// ============================================================================

export {
  // 基本バリデーション
  isString,
  isNonEmptyString,
  isNumber,
  isPositiveInteger,
  isBoolean,
  isArray,
  isObject,
  isEmail,
  isStrongPassword,
  isSlug,
  isOneOf,
  
  // ファイルバリデーション
  isAllowedFileExtension,
  isImageFile,
  isVideoFile,
};
