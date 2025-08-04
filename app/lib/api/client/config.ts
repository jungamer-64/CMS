/**
 * 統合APIクライアント設定
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  baseURL?: string;
  parseResponse?: boolean;
  body?: unknown;
}

export interface InterceptorHandlers<T = unknown> {
  onFulfilled?: (value: T) => T | Promise<T>;
  onRejected?: (error: unknown) => unknown;
}

// デフォルト設定
export const DEFAULT_CONFIG: Partial<RequestConfig> = {
  timeout: 10000,
  retries: 1,
  retryDelay: 1000,
  parseResponse: true,
  headers: {
    'Content-Type': 'application/json',
  },
};
