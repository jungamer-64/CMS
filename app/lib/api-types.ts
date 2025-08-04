/**
 * 高速・厳格型安全APIタイプ（後方互換性）
 * 
 * - コア型システムからの再エクスポート
 * - 統一された型定義
 * - パフォーマンス最適化
 */

// コア型システムからの統一エクスポート
export * from './core/types';
export * from './api-utils';

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
  readonly post: import('./core/types').Post;
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

export interface SettingsResponse {
  readonly settings: import('./core/types').Settings;
}

export interface ThemeUpdateRequest {
  readonly darkMode: boolean;
}

export interface ThemeResponse {
  readonly darkMode: boolean;
  readonly theme?: string;
}

// バリデーションスキーマ型（後方互換性）
export interface ValidationSchema {
  readonly required?: readonly string[];
  readonly optional?: readonly string[];
  readonly rules?: Record<string, unknown>;
}
