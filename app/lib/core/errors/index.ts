/**
 * 統合エラーハンドリングエクスポート
 * 
 * 全てのエラークラスと関連ユーティリティを一箇所から提供します。
 */

// 基本エラークラスをエクスポート
export * from './base-errors';

// APIエラークラスをエクスポート
export * from './api-errors';

// ============================================================================
// エラーユーティリティ関数
// ============================================================================

import {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  MultipleValidationError,
} from './base-errors';

import {
  ApiError,
  HttpClientError,
  NetworkError,
  TimeoutError,
} from './api-errors';

/**
 * エラーが特定の種類かどうかを判定するユーティリティ
 */
export const isErrorType = {
  /**
   * BaseErrorかどうか
   */
  base: (error: unknown): error is BaseError => error instanceof BaseError,

  /**
   * ValidationErrorかどうか
   */
  validation: (error: unknown): error is ValidationError => error instanceof ValidationError,

  /**
   * AuthenticationErrorかどうか
   */
  authentication: (error: unknown): error is AuthenticationError => error instanceof AuthenticationError,

  /**
   * AuthorizationErrorかどうか
   */
  authorization: (error: unknown): error is AuthorizationError => error instanceof AuthorizationError,

  /**
   * NotFoundErrorかどうか
   */
  notFound: (error: unknown): error is NotFoundError => error instanceof NotFoundError,

  /**
   * ConflictErrorかどうか
   */
  conflict: (error: unknown): error is ConflictError => error instanceof ConflictError,

  /**
   * InternalServerErrorかどうか
   */
  internal: (error: unknown): error is InternalServerError => error instanceof InternalServerError,

  /**
   * ApiErrorかどうか
   */
  api: (error: unknown): error is ApiError => error instanceof ApiError,

  /**
   * HttpClientErrorかどうか
   */
  httpClient: (error: unknown): error is HttpClientError => error instanceof HttpClientError,

  /**
   * NetworkErrorかどうか
   */
  network: (error: unknown): error is NetworkError => error instanceof NetworkError,

  /**
   * TimeoutErrorかどうか
   */
  timeout: (error: unknown): error is TimeoutError => error instanceof TimeoutError,
};

/**
 * エラーをHTTPステータスコードに変換
 */
export function errorToStatusCode(error: unknown): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  if (error instanceof ValidationError) {
    return 400;
  }

  if (error instanceof AuthenticationError) {
    return 401;
  }

  if (error instanceof AuthorizationError) {
    return 403;
  }

  if (error instanceof NotFoundError) {
    return 404;
  }

  if (error instanceof ConflictError) {
    return 409;
  }

  if (error instanceof TimeoutError) {
    return 408;
  }

  return 500; // Internal Server Error
}

/**
 * エラーをログ出力用の構造化データに変換
 */
export function errorToLogData(error: unknown): Record<string, unknown> {
  if (error instanceof BaseError) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
    };
  }

  return {
    error: String(error),
    timestamp: new Date(),
  };
}

/**
 * エラーからユーザー向けメッセージを取得
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '予期しないエラーが発生しました';
}

/**
 * 開発環境でのエラー詳細情報を取得
 */
export function getErrorDetails(error: unknown): Record<string, unknown> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return {
      message: getErrorMessage(error),
    };
  }

  return errorToLogData(error);
}

/**
 * エラーチェーンを辿って根本原因を取得
 */
export function getRootCause(error: unknown): unknown {
  if (error instanceof BaseError && 'cause' in error && error.cause) {
    return getRootCause(error.cause);
  }

  if (error instanceof Error && error.cause) {
    return getRootCause(error.cause);
  }

  return error;
}

/**
 * 複数のエラーを集約
 */
export function aggregateErrors(errors: unknown[]): BaseError {
  const validationErrors = errors.filter(isErrorType.validation);

  if (validationErrors.length > 0) {
    return new MultipleValidationError(validationErrors);
  }

  const messages = errors
    .map(getErrorMessage)
    .filter((message, index, arr) => arr.indexOf(message) === index); // 重複を除去

  return new InternalServerError(`Multiple errors occurred: ${messages.join(', ')}`);
}
