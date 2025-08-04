/**
 * APIクライアントインターセプター
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import type { RequestConfig, InterceptorHandlers } from './config';

export class InterceptorManager<T> {
  private handlers: InterceptorHandlers<T>[] = [];

  // インターセプターを追加
  use(handlers: InterceptorHandlers<T>): number {
    this.handlers.push(handlers);
    return this.handlers.length - 1;
  }

  // インターセプターを削除
  eject(id: number): void {
    this.handlers.splice(id, 1);
  }

  // 全てのインターセプターを適用
  async forEach<V extends T>(
    value: V,
    isRequest: boolean = true
  ): Promise<V> {
    let result = value;
    
    for (const handler of this.handlers) {
      try {
        if (handler.onFulfilled) {
          result = await handler.onFulfilled(result as T) as V;
        }
      } catch (error) {
        if (handler.onRejected) {
          const handledError = handler.onRejected(error);
          if (handledError !== undefined) {
            throw handledError;
          }
        }
        throw error;
      }
    }
    
    return result;
  }
}

// 認証トークンを自動追加するインターセプター
export function createAuthInterceptor(getToken: () => string | null): InterceptorHandlers<RequestConfig> {
  return {
    onFulfilled: async (config: RequestConfig) => {
      const token = getToken();
      if (token) {
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        };
      }
      return config;
    },
  };
}

// ログ出力インターセプター
export function createLoggingInterceptor(): InterceptorHandlers<RequestConfig> {
  return {
    onFulfilled: async (config: RequestConfig) => {
      console.log(`[API Request] ${config.method || 'GET'}`, config);
      return config;
    },
    onRejected: (error: unknown) => {
      console.error('[API Request Error]', error);
      throw error;
    },
  };
}
