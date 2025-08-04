/**
 * ドメインエンティティ型定義
 * 
 * アプリケーションの中核となるデータ構造を定義します。
 * 全ての型はreadonlyプロパティを使用し、不変性を保証します。
 */

import type { UserRole, MediaType } from './base-types';

// ============================================================================
// 共通エンティティインターフェース
// ============================================================================

/**
 * 全エンティティの基本構造
 */
export interface BaseEntity {
  readonly _id?: string;    // MongoDB ObjectId
  readonly id: string;      // ユニーク識別子
  readonly createdAt: Date; // 作成日時
  readonly updatedAt?: Date; // 更新日時
}

// ============================================================================
// 投稿エンティティ
// ============================================================================

/**
 * 投稿エンティティ
 */
export interface Post extends BaseEntity {
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly isDeleted?: boolean;
  readonly media?: readonly string[];
}

/**
 * 投稿作成用入力型
 */
export interface PostInput {
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly slug?: string;
  readonly media?: readonly string[];
}

/**
 * 投稿更新用入力型
 */
export interface PostUpdateInput {
  readonly title?: string;
  readonly content?: string;
  readonly slug?: string;
  readonly media?: readonly string[];
}

// ============================================================================
// ユーザーエンティティ
// ============================================================================

/**
 * ユーザーエンティティ（内部用、パスワードハッシュ含む）
 */
export interface User extends BaseEntity {
  readonly username: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly darkMode?: boolean;
  readonly isActive?: boolean;
}

/**
 * ユーザーエンティティ（公開用、パスワードハッシュ除外）
 */
export interface UserEntity extends BaseEntity {
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly darkMode?: boolean;
  readonly isActive?: boolean;
}

/**
 * ユーザー作成用入力型
 */
export interface UserInput {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  readonly role?: UserRole;
  readonly darkMode?: boolean;
}

/**
 * ユーザー更新用入力型
 */
export interface UserUpdateInput {
  readonly username?: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly role?: UserRole;
  readonly darkMode?: boolean;
  readonly isActive?: boolean;
}

/**
 * パスワード更新用入力型
 */
export interface PasswordUpdateInput {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/**
 * ログイン認証情報型
 */
export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
}

/**
 * パスワードリセットトークンエンティティ
 */
export interface PasswordResetToken extends BaseEntity {
  readonly userId: string;
  readonly token: string;
  readonly email: string;
  readonly expiresAt: Date;
  readonly used: boolean;
}

/**
 * 管理者用ユーザー情報型
 */
export interface AdminUserManagement extends BaseEntity {
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly darkMode?: boolean;
  readonly lastLoginAt?: Date;
  readonly isActive: boolean;
}

/**
 * ユーザーセッション情報型
 */
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

// ============================================================================
// コメントエンティティ
// ============================================================================

/**
 * コメントエンティティ
 */
export interface Comment extends BaseEntity {
  readonly postSlug: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly content: string;
  readonly isApproved: boolean;
  readonly isDeleted?: boolean;
}

/**
 * コメント作成用入力型
 */
export interface CommentInput {
  readonly postSlug: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly content: string;
}

/**
 * コメント更新用入力型
 */
export interface CommentUpdateInput {
  readonly content?: string;
}

// ============================================================================
// メディアエンティティ
// ============================================================================

/**
 * メディアファイルエンティティ
 */
export interface MediaFile extends BaseEntity {
  readonly originalName: string;
  readonly filename: string;
  readonly path: string;
  readonly url: string;
  readonly mimetype: string;
  readonly size: number;
  readonly mediaType: MediaType;
  readonly uploadedBy?: string;
  readonly uploadDate: Date;
  readonly tags?: readonly string[];
  readonly description?: string;
}

/**
 * メディアアップロード用入力型
 */
export interface MediaUploadInput {
  readonly file: File;
  readonly tags?: readonly string[];
  readonly description?: string;
}

/**
 * メディア更新用入力型
 */
export interface MediaUpdateInput {
  readonly tags?: readonly string[];
  readonly description?: string;
}

// ============================================================================
// 設定エンティティ
// ============================================================================

/**
 * サイト設定エンティティ
 */
export interface SiteSettings {
  readonly siteName: string;
  readonly siteDescription: string;
  readonly adminEmail: string;
  readonly maxFileSize: number;
  readonly allowedFileTypes: readonly string[];
  readonly postsPerPage: number;
  readonly enableComments: boolean;
  readonly enableRegistration: boolean;
}

/**
 * 設定更新用入力型
 */
export interface SettingsUpdateInput {
  readonly siteName?: string;
  readonly siteDescription?: string;
  readonly adminEmail?: string;
  readonly maxFileSize?: number;
  readonly allowedFileTypes?: readonly string[];
  readonly postsPerPage?: number;
  readonly enableComments?: boolean;
  readonly enableRegistration?: boolean;
}

// ============================================================================
// APIキーエンティティ
// ============================================================================

/**
 * APIキー権限
 */
export interface ApiKeyPermissions {
  readonly posts: {
    readonly read: boolean;
    readonly create: boolean;
    readonly update: boolean;
    readonly delete: boolean;
  };
  readonly users: {
    readonly read: boolean;
    readonly create: boolean;
    readonly update: boolean;
    readonly delete: boolean;
  };
  readonly comments: {
    readonly read: boolean;
    readonly create: boolean;
    readonly update: boolean;
    readonly delete: boolean;
    readonly moderate: boolean;
  };
  readonly media: {
    readonly read: boolean;
    readonly upload: boolean;
    readonly delete: boolean;
  };
  readonly uploads: {
    readonly read: boolean;
    readonly create: boolean;
    readonly delete: boolean;
  };
  readonly settings: {
    readonly read: boolean;
    readonly update: boolean;
  };
  readonly admin: boolean;
}

/**
 * APIキーエンティティ
 */
export interface ApiKey extends BaseEntity {
  readonly name: string;
  readonly key: string;
  readonly keyHash: string;
  readonly userId: string;
  readonly permissions: ApiKeyPermissions;
  readonly expiresAt?: Date;
  readonly lastUsedAt?: Date;
  readonly isActive: boolean;
}

/**
 * APIキー作成用入力型
 */
export interface ApiKeyInput {
  readonly name: string;
  readonly permissions: ApiKeyPermissions;
  readonly expiresAt?: Date;
}

/**
 * APIキー更新用入力型
 */
export interface ApiKeyUpdateInput {
  readonly name?: string;
  readonly permissions?: ApiKeyPermissions;
  readonly expiresAt?: Date;
  readonly isActive?: boolean;
}

// ============================================================================
// ページエンティティ
// ============================================================================

/**
 * ページステータス型
 */
export type PageStatus = 'draft' | 'published' | 'private';

/**
 * 静的ページエンティティ（統合版）
 */
export interface StaticPage extends BaseEntity {
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly excerpt?: string;
  readonly status?: PageStatus;
  readonly template?: string;
  readonly metaTitle?: string;
  readonly metaDescription?: string;
  readonly metaKeywords?: string;
  readonly publishedAt?: Date;
  readonly author?: string;
  readonly isHomePage?: boolean;
  readonly isPublished?: boolean;
}

/**
 * ページ作成用入力型
 */
export interface StaticPageInput {
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly excerpt?: string;
  readonly status?: PageStatus;
  readonly template?: string;
  readonly metaTitle?: string;
  readonly metaDescription?: string;
  readonly metaKeywords?: string;
  readonly author?: string;
  readonly isHomePage?: boolean;
  readonly isPublished?: boolean;
}

// ============================================================================
// 互換性エイリアス
// ============================================================================

/**
 * 互換性のためのエイリアス型定義
 */
export type PostEntity = Post;
export type CommentEntity = Comment;
export type PageEntity = StaticPage;
export type SettingsEntity = SiteSettings;
export type Settings = SiteSettings;
export type Page = StaticPage;
