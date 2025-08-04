/**
 * 環境設定互換性ファイル
 * 
 * 既存のコンポーネントが参照している環境設定を提供し、
 * 新しい環境設定システムへのブリッジとして機能します。
 */

// 新しい環境設定システムから再エクスポート
export {
  env,
  type Environment
} from './core/config/environment';

// ============================================================================
// 互換性のための環境変数アクセス関数
// ============================================================================

import { env } from './core/config/environment';

/**
 * 環境変数の取得（互換性のため）
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * 必須環境変数の取得（互換性のため）
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * 環境変数をboolean型として取得（互換性のため）
 */
export function getBooleanEnv(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * 環境変数をnumber型として取得（互換性のため）
 */
export function getNumberEnv(key: string, defaultValue = 0): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ============================================================================
// 互換性のための設定オブジェクト
// ============================================================================

/**
 * アプリケーション設定（互換性のため）
 */
export const config = {
  // データベース
  mongodb: {
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB_NAME
  },
  
  // 認証
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '1d',
    sessionSecret: env.SESSION_SECRET || 'fallback-secret'
  },
  
  // GitHub統合
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    webhookSecret: env.GITHUB_WEBHOOK_SECRET
  },
  
  // アプリケーション
  app: {
    environment: env.NODE_ENV,
    port: getNumberEnv('PORT', 3000),
    url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
  
  // 外部サービス
  external: {
    uploadLimit: getNumberEnv('UPLOAD_LIMIT', 10485760), // 10MB
    allowedFileTypes: env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
};

/**
 * 開発環境かどうかの判定（互換性のため）
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * 本番環境かどうかの判定（互換性のため）
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * テスト環境かどうかの判定（互換性のため）
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * デフォルトエクスポート（互換性のため）
 */
export default config;
