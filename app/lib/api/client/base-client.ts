/**
 * 統一されたAPIクライアント - base-client.ts
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 *
 * 既存のapi-client.tsの機能を統合し、core/errorsと連携
 */

import { HttpClientError } from '../../core/errors';
import type { ApiResponse } from '../../core/types';
import type { RequestConfig } from './config';
import { DEFAULT_CONFIG } from './config';
import { InterceptorManager } from './interceptors';

export class UnifiedApiClient {
  private baseURL: string;
  private defaultConfig: RequestConfig;
  private requestInterceptors = new InterceptorManager<RequestConfig>();
  private responseInterceptors = new InterceptorManager<Response>();

  constructor(baseURL = '', defaultConfig: RequestConfig = {}) {
    this.baseURL = baseURL;
    this.defaultConfig = {
      ...DEFAULT_CONFIG,
      ...defaultConfig,
    };
  }

  // インターセプター管理
  get interceptors() {
    return {
      request: this.requestInterceptors,
      response: this.responseInterceptors,
    };
  }

  // 設定をマージ
  private mergeConfig(config: RequestConfig): RequestConfig {
    return {
      ...this.defaultConfig,
      ...config,
      headers: {
        ...this.defaultConfig.headers,
        ...config.headers,
      },
    };
  }

  // URLを構築
  private buildURL(url: string, baseURL?: string): string {
    const base = baseURL || this.baseURL;
    if (!base) return url;

    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    return `${normalizedBase}${normalizedUrl}`;
  }

  // ボディを処理
  private processBody(body: unknown): string | FormData | undefined {
    if (body === undefined || body === null) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }

    if (typeof body === 'string') {
      return body;
    }

    return JSON.stringify(body);
  }

  // レスポンスを解析
  private async parseResponse<T>(response: Response, parseResponse: boolean = true): Promise<T> {
    if (!parseResponse) {
      return response as unknown as T;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return await response.json();
    }

    if (contentType.includes('text/')) {
      return await response.text() as unknown as T;
    }

    return await response.blob() as unknown as T;
  }

  // 再試行ロジック
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 1,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err: unknown) {
        lastError = err as Error;

        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError!;
  }

  // メインリクエストメソッド
  async request<T = unknown>(url: string, config: RequestConfig = {}): Promise<T> {
    const mergedConfig = this.mergeConfig(config);

    // リクエストインターセプターを適用
    const finalConfig = await this.requestInterceptors.forEach(mergedConfig);

    const { timeout, retries, retryDelay, baseURL, parseResponse, body, ...fetchConfig } = finalConfig;

    const requestFn = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

      try {
        const processedBody = this.processBody(body);

        const response = await fetch(this.buildURL(url, baseURL), {
          ...fetchConfig,
          body: processedBody,
          signal: controller.signal,
        });

        // レスポンスインターセプターを適用
        const finalResponse = await this.responseInterceptors.forEach(response);

        if (!finalResponse.ok) {
          const errorData = await this.parseResponse(finalResponse, parseResponse);
          throw new HttpClientError(
            `HTTP Error: ${finalResponse.status} ${finalResponse.statusText}`,
            finalResponse.status,
            finalResponse,
            errorData
          );
        }

        return await this.parseResponse<T>(finalResponse, parseResponse);

      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    return this.withRetry(requestFn, retries, retryDelay);
  }

  // HTTPメソッド別のヘルパーメソッド
  async get<T = unknown>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = unknown>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', body: data });
  }

  async put<T = unknown>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data });
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data });
  }

  async delete<T = unknown>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// デフォルトクライアントインスタンス
export const apiClient = new UnifiedApiClient();

// ApiResponse型に対応したヘルパー関数
export async function apiRequest<T>(
  url: string,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  try {
    const data = await apiClient.request<T>(url, config);
    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    if (err instanceof HttpClientError) {
      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
