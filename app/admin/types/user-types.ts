/**
 * Admin User Management Types
 * ユーザー管理用の型定義
 */

/**
 * RESTful User Resource (API Response)
 */
export interface RestUserResource {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: 'admin' | 'user';
  readonly darkMode: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly _links: {
    readonly self: string;
    readonly posts: string;
    readonly edit?: string;
    readonly delete?: string;
  };
}

/**
 * RESTful List Response
 */
export interface RestListResponse<T> {
  readonly success: true;
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
  };
  readonly meta: {
    readonly message: string;
    readonly filters: Record<string, unknown>;
  };
  readonly timestamp: string;
}

/**
 * RESTful Error Response
 */
export interface RestErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: readonly string[];
    readonly field?: string;
  };
  readonly timestamp: string;
}

/**
 * UI User Model (Domain-specific)
 */
export interface UiUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: 'admin' | 'user';
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly stats?: {
    readonly postsCount: number;
    readonly lastActivity: Date;
  };
}

export type UserRole = UiUser['role'];
