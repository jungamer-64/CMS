/**
 * API専用エラークラス
 * 
 * HTTP APIのエラーハンドリングに特化したエラークラスを提供します。
 * レスポンスステータスコードや詳細な情報を含みます。
 */

import { BaseError } from './base-errors';
import { ApiErrorCode } from '../types';

// ============================================================================
// API基本エラー
// ============================================================================

/**
 * API エラークラス
 */
export class ApiError extends BaseError {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: ApiErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message, 'ApiError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  /**
   * HTTPステータスコードから適切なエラーコードを推定
   */
  static getCodeFromStatusCode(statusCode: number): ApiErrorCode {
    switch (statusCode) {
      case 400:
        return ApiErrorCode.VALIDATION_ERROR;
      case 401:
        return ApiErrorCode.UNAUTHORIZED;
      case 403:
        return ApiErrorCode.FORBIDDEN;
      case 404:
        return ApiErrorCode.NOT_FOUND;
      case 409:
        return ApiErrorCode.CONFLICT;
      case 429:
        return ApiErrorCode.RATE_LIMIT_EXCEEDED;
      case 500:
      default:
        return ApiErrorCode.INTERNAL_ERROR;
    }
  }
}

// ============================================================================
// HTTPクライアントエラー
// ============================================================================

/**
 * HTTPクライアントエラー
 */
export class HttpClientError extends BaseError {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: Response,
    public readonly data?: unknown,
    public readonly url?: string
  ) {
    super(message, 'HttpClientError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      url: this.url,
      data: this.data,
      timestamp: this.timestamp,
    };
  }

  /**
   * Fetchの Response からエラーを作成
   */
  static async fromResponse(response: Response, url?: string): Promise<HttpClientError> {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    const message = `HTTP Error ${response.status}: ${response.statusText}`;
    return new HttpClientError(message, response.status, response, data, url);
  }
}

// ============================================================================
// ネットワークエラー
// ============================================================================

/**
 * ネットワークエラー
 */
export class NetworkError extends BaseError {
  constructor(
    message: string,
    public readonly url?: string,
    public readonly cause?: Error
  ) {
    super(message, 'NetworkError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      url: this.url,
      cause: this.cause?.message,
      timestamp: this.timestamp,
    };
  }
}

/**
 * タイムアウトエラー
 */
export class TimeoutError extends BaseError {
  constructor(
    message: string = 'リクエストがタイムアウトしました',
    public readonly timeout?: number,
    public readonly url?: string
  ) {
    super(message, 'TimeoutError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      timeout: this.timeout,
      url: this.url,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// API固有エラー
// ============================================================================

/**
 * バリデーションAPIエラー
 */
export class ValidationApiError extends ApiError {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string[]> = {}
  ) {
    super(message, 400, ApiErrorCode.VALIDATION_ERROR, { fieldErrors });
  }

  /**
   * フィールドエラーを追加
   */
  addFieldError(field: string, error: string): void {
    if (!this.fieldErrors[field]) {
      this.fieldErrors[field] = [];
    }
    this.fieldErrors[field].push(error);
  }

  /**
   * 特定フィールドのエラーを取得
   */
  getFieldErrors(field: string): string[] {
    return this.fieldErrors[field] || [];
  }

  /**
   * エラーがあるかチェック
   */
  hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    };
  }
}

/**
 * 認証APIエラー
 */
export class AuthenticationApiError extends ApiError {
  constructor(message: string = '認証が必要です') {
    super(message, 401, ApiErrorCode.UNAUTHORIZED);
  }
}

/**
 * 認可APIエラー
 */
export class AuthorizationApiError extends ApiError {
  constructor(
    message: string = 'アクセスが拒否されました',
    public readonly requiredPermissions?: string[]
  ) {
    super(message, 403, ApiErrorCode.FORBIDDEN, { requiredPermissions });
  }
}

/**
 * リソース未発見APIエラー
 */
export class NotFoundApiError extends ApiError {
  constructor(
    message: string = 'リソースが見つかりません',
    public readonly resourceType?: string,
    public readonly resourceId?: string
  ) {
    super(message, 404, ApiErrorCode.NOT_FOUND, { resourceType, resourceId });
  }
}

/**
 * 競合APIエラー
 */
export class ConflictApiError extends ApiError {
  constructor(
    message: string = 'リソースが競合しています',
    public readonly conflictingField?: string
  ) {
    super(message, 409, ApiErrorCode.CONFLICT, { conflictingField });
  }
}

/**
 * レート制限APIエラー
 */
export class RateLimitApiError extends ApiError {
  constructor(
    message: string = 'レート制限に達しました',
    public readonly retryAfter?: number
  ) {
    super(message, 429, ApiErrorCode.RATE_LIMIT_EXCEEDED, { retryAfter });
  }
}

// ============================================================================
// APIエラーファクトリー
// ============================================================================

/**
 * APIエラー作成のファクトリー関数
 */
export const createApiError = {
  /**
   * バリデーションエラー
   */
  validation: (message: string, fieldErrors?: Record<string, string[]>) => {
    const error = new ValidationApiError(message);
    if (fieldErrors) {
      Object.assign(error.fieldErrors, fieldErrors);
    }
    return error;
  },

  /**
   * 認証エラー
   */
  authentication: (message?: string) => new AuthenticationApiError(message),

  /**
   * 認可エラー
   */
  authorization: (message?: string, requiredPermissions?: string[]) => 
    new AuthorizationApiError(message, requiredPermissions),

  /**
   * リソース未発見エラー
   */
  notFound: (message?: string, resourceType?: string, resourceId?: string) => 
    new NotFoundApiError(message, resourceType, resourceId),

  /**
   * 競合エラー
   */
  conflict: (message?: string, conflictingField?: string) => 
    new ConflictApiError(message, conflictingField),

  /**
   * レート制限エラー
   */
  rateLimit: (message?: string, retryAfter?: number) => 
    new RateLimitApiError(message, retryAfter),

  /**
   * 汎用APIエラー
   */
  generic: (message: string, statusCode?: number, code?: ApiErrorCode) => 
    new ApiError(message, statusCode, code),

  /**
   * HTTPクライアントエラー
   */
  httpClient: (message: string, status?: number, url?: string, data?: unknown) => 
    new HttpClientError(message, status, undefined, data, url),

  /**
   * ネットワークエラー
   */
  network: (message: string, url?: string, cause?: Error) => 
    new NetworkError(message, url, cause),

  /**
   * タイムアウトエラー
   */
  timeout: (message?: string, timeout?: number, url?: string) => 
    new TimeoutError(message, timeout, url),
};
