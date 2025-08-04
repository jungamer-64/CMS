/**
 * レート制限システム
 * 
 * 本番環境ではRedisを使用し、開発環境ではメモリベースのフォールバック
 */

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  resetTime?: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private readonly memoryStore = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * レート制限をチェック
   */
  async checkLimit(
    key: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    // Redisが利用可能な場合はRedisを使用
    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      return this.checkLimitRedis(key, config);
    }

    // フォールバック: メモリベース
    return this.checkLimitMemory(key, config);
  }

  /**
   * 失敗試行を記録
   */
  async recordFailure(key: string, config: RateLimitConfig): Promise<void> {
    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      await this.recordFailureRedis(key, config);
    } else {
      this.recordFailureMemory(key, config);
    }
  }

  /**
   * 成功時のクリーンアップ
   */
  async clearFailures(key: string): Promise<void> {
    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      await this.clearFailuresRedis(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  /**
   * Redisベースのレート制限チェック
   */
  private async checkLimitRedis(
    key: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      // Redis実装は将来の拡張用
      // 現在はメモリベースにフォールバック
      return this.checkLimitMemory(key, config);
    } catch (error) {
      console.error('Redis rate limit check failed, falling back to memory:', error);
      return this.checkLimitMemory(key, config);
    }
  }

  /**
   * メモリベースのレート制限チェック
   */
  private checkLimitMemory(
    key: string, 
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const attempts = this.memoryStore.get(key);

    if (!attempts) {
      return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
    }

    // ブロック期間中かチェック
    if (attempts.blockedUntil && now < attempts.blockedUntil) {
      return { 
        allowed: false, 
        resetTime: attempts.blockedUntil 
      };
    }

    // ブロック期間が過ぎていればリセット
    if (attempts.blockedUntil && now >= attempts.blockedUntil) {
      this.memoryStore.delete(key);
      return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
    }

    // 時間窓が過ぎていればリセット
    if (now - attempts.lastAttempt > config.windowMs) {
      this.memoryStore.delete(key);
      return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
    }

    // 制限内かチェック
    if (attempts.count >= config.maxAttempts) {
      attempts.blockedUntil = now + config.blockDurationMs;
      return { 
        allowed: false, 
        resetTime: attempts.blockedUntil 
      };
    }

    return { 
      allowed: true, 
      remainingAttempts: config.maxAttempts - attempts.count - 1 
    };
  }

  /**
   * Redisベースの失敗記録
   */
  private async recordFailureRedis(key: string, config: RateLimitConfig): Promise<void> {
    try {
      // Redis実装は将来の拡張用
      this.recordFailureMemory(key, config);
    } catch (error) {
      console.error('Redis record failure failed, falling back to memory:', error);
      this.recordFailureMemory(key, config);
    }
  }

  /**
   * メモリベースの失敗記録
   */
  private recordFailureMemory(key: string, config: RateLimitConfig): void {
    const now = Date.now();
    const attempts = this.memoryStore.get(key) || { count: 0, lastAttempt: 0 };

    attempts.count++;
    attempts.lastAttempt = now;

    if (attempts.count >= config.maxAttempts) {
      attempts.blockedUntil = now + config.blockDurationMs;
    }

    this.memoryStore.set(key, attempts);
  }

  /**
   * Redisベースのクリーンアップ
   */
  private async clearFailuresRedis(key: string): Promise<void> {
    try {
      // Redis実装は将来の拡張用
      this.memoryStore.delete(key);
    } catch (error) {
      console.error('Redis clear failures failed, falling back to memory:', error);
      this.memoryStore.delete(key);
    }
  }

  /**
   * 統計情報の取得
   */
  async getStats(): Promise<{
    totalBlocked: number;
    activeBlocks: number;
  }> {
    const now = Date.now();
    let totalBlocked = 0;
    let activeBlocks = 0;

    for (const [, attempts] of this.memoryStore) {
      if (attempts.blockedUntil) {
        totalBlocked++;
        if (attempts.blockedUntil > now) {
          activeBlocks++;
        }
      }
    }

    return { totalBlocked, activeBlocks };
  }
}
