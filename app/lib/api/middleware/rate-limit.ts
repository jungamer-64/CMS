/**
 * レート制限ミドルウェア
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  max: number; // 最大リクエスト数
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// メモリベースのレート制限ストア（本番環境ではRedisなどを使用）
const store = new Map<string, RateLimitEntry>();

// ストアのクリーンアップ（定期的に期限切れエントリを削除）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // 1分ごと

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => getClientIP(req),
  } = config;

  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: NextRequest, ...args: unknown[]) {
      const key = keyGenerator(req);
      const now = Date.now();
      const resetTime = now + windowMs;

      // 現在のエントリを取得または作成
      let entry = store.get(key);
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime };
        store.set(key, entry);
      }

      // リクエスト数をチェック
      if (entry.count >= max) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': max.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': entry.resetTime.toString(),
            },
          }
        );
      }

      // リクエスト数を増加
      entry.count++;

      try {
        const result = await originalMethod.apply(this, [req, ...args]);
        
        // 成功したリクエストをスキップする場合
        if (skipSuccessfulRequests && result instanceof NextResponse && result.status < 400) {
          entry.count--;
        }
        
        return result;
      } catch (error) {
        // 失敗したリクエストをスキップする場合
        if (skipFailedRequests) {
          entry.count--;
        }
        throw error;
      }
    };

    return descriptor;
  };
}

// クライアントIPアドレスを取得
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // NextRequestにはipプロパティがないため、ヘッダーから取得
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

// 特定のAPIエンドポイント用のプリセット
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 15分間に100リクエスト
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 15分間に5回の認証試行
  skipSuccessfulRequests: true,
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 10, // 1時間に10回のアップロード
});
