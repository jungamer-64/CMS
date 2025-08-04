/**
 * 統一されたエラークラス階層
 * 
 * アプリケーション全体で一貫したエラーハンドリングを提供します。
 * 全てのエラークラスは構造化された情報を持ち、適切にシリアライズできます。
 */

// ============================================================================
// 基本エラークラス
// ============================================================================

/**
 * 全てのアプリケーションエラーの基底クラス
 */
export abstract class BaseError extends Error {
  public readonly name: string;
  public readonly timestamp: Date;

  constructor(message: string, name?: string) {
    super(message);
    this.name = name || this.constructor.name;
    this.timestamp = new Date();
    
    // スタックトレースの適切な設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * エラーをJSON形式にシリアライズ
   */
  abstract toJSON(): Record<string, unknown>;

  /**
   * エラーの文字列表現
   */
  toString(): string {
    return `${this.name}: ${this.message}`;
  }
}

// ============================================================================
// バリデーションエラー
// ============================================================================

/**
 * データバリデーションエラー
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    public readonly code?: string
  ) {
    super(message, 'ValidationError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      code: this.code,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 複数のバリデーションエラー
 */
export class MultipleValidationError extends BaseError {
  constructor(
    public readonly errors: ValidationError[]
  ) {
    const message = `Validation failed: ${errors.map(e => e.message).join(', ')}`;
    super(message, 'MultipleValidationError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors.map(error => error.toJSON()),
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// 認証・認可エラー
// ============================================================================

/**
 * 認証エラー
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = '認証が必要です') {
    super(message, 'AuthenticationError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends BaseError {
  constructor(
    message: string = 'アクセスが拒否されました',
    public readonly requiredPermissions?: string[]
  ) {
    super(message, 'AuthorizationError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      requiredPermissions: this.requiredPermissions,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// リソースエラー
// ============================================================================

/**
 * リソース未発見エラー
 */
export class NotFoundError extends BaseError {
  constructor(
    message: string = 'リソースが見つかりません',
    public readonly resourceType?: string,
    public readonly resourceId?: string
  ) {
    super(message, 'NotFoundError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      timestamp: this.timestamp,
    };
  }
}

/**
 * リソース競合エラー
 */
export class ConflictError extends BaseError {
  constructor(
    message: string = 'リソースが競合しています',
    public readonly conflictingField?: string,
    public readonly conflictingValue?: unknown
  ) {
    super(message, 'ConflictError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      conflictingField: this.conflictingField,
      conflictingValue: this.conflictingValue,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// システムエラー
// ============================================================================

/**
 * 内部サーバーエラー
 */
export class InternalServerError extends BaseError {
  constructor(
    message: string = '内部サーバーエラーが発生しました',
    public readonly cause?: Error
  ) {
    super(message, 'InternalServerError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      cause: this.cause?.message,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 外部サービスエラー
 */
export class ExternalServiceError extends BaseError {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message, 'ExternalServiceError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      serviceName: this.serviceName,
      statusCode: this.statusCode,
      cause: this.cause?.message,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// レート制限エラー
// ============================================================================

/**
 * レート制限エラー
 */
export class RateLimitError extends BaseError {
  constructor(
    message: string = 'レート制限に達しました',
    public readonly retryAfter?: number,
    public readonly limit?: number,
    public readonly remaining?: number
  ) {
    super(message, 'RateLimitError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      retryAfter: this.retryAfter,
      limit: this.limit,
      remaining: this.remaining,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// ファイル操作エラー
// ============================================================================

/**
 * ファイル操作エラー
 */
export class FileOperationError extends BaseError {
  constructor(
    message: string,
    public readonly operation: 'upload' | 'delete' | 'read' | 'write',
    public readonly filename?: string,
    public readonly cause?: Error
  ) {
    super(message, 'FileOperationError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      operation: this.operation,
      filename: this.filename,
      cause: this.cause?.message,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// エラーファクトリー関数
// ============================================================================

/**
 * エラーファクトリー関数の型
 */
export type ErrorFactory = {
  validation: (message: string, field?: string, value?: unknown) => ValidationError;
  authentication: (message?: string) => AuthenticationError;
  authorization: (message?: string, requiredPermissions?: string[]) => AuthorizationError;
  notFound: (message?: string, resourceType?: string, resourceId?: string) => NotFoundError;
  conflict: (message?: string, field?: string, value?: unknown) => ConflictError;
  internal: (message?: string, cause?: Error) => InternalServerError;
  external: (message: string, serviceName: string, statusCode?: number, cause?: Error) => ExternalServiceError;
  rateLimit: (message?: string, retryAfter?: number) => RateLimitError;
  fileOperation: (message: string, operation: 'upload' | 'delete' | 'read' | 'write', filename?: string, cause?: Error) => FileOperationError;
};

/**
 * エラー作成のファクトリー関数
 */
export const createError: ErrorFactory = {
  validation: (message, field, value) => new ValidationError(message, field, value),
  authentication: (message) => new AuthenticationError(message),
  authorization: (message, requiredPermissions) => new AuthorizationError(message, requiredPermissions),
  notFound: (message, resourceType, resourceId) => new NotFoundError(message, resourceType, resourceId),
  conflict: (message, field, value) => new ConflictError(message, field, value),
  internal: (message, cause) => new InternalServerError(message, cause),
  external: (message, serviceName, statusCode, cause) => new ExternalServiceError(message, serviceName, statusCode, cause),
  rateLimit: (message, retryAfter) => new RateLimitError(message, retryAfter),
  fileOperation: (message, operation, filename, cause) => new FileOperationError(message, operation, filename, cause),
};
