/**
 * 環境設定システム
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

export interface Environment {
  // Node環境
  NODE_ENV: string;
  
  // データベース
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  MONGODB_DB: string; // 互換性のため追加
  
  // 認証
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  SESSION_SECRET?: string;
  
  // API設定
  API_KEYS_DATA?: string;
  DEFAULT_API_KEY?: string;
  
  // GitHub統合
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_WEBHOOK_SECRET?: string;
  
  // アプリケーション
  NEXT_PUBLIC_APP_URL?: string;
  PORT?: string;
  
  // ファイルアップロード
  UPLOAD_LIMIT?: string;
  ALLOWED_FILE_TYPES?: string;
}

/**
 * 環境変数の検証と取得
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * 環境設定オブジェクト
 */
export const env: Environment = {
  // Node環境（必須）
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // データベース（必須）
  MONGODB_URI: getRequiredEnv('MONGODB_URI'),
  MONGODB_DB_NAME: getRequiredEnv('MONGODB_DB_NAME'),
  MONGODB_DB: process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || '', // 互換性のため
  
  // 認証（必須）
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getOptionalEnv('JWT_EXPIRES_IN'),
  SESSION_SECRET: getOptionalEnv('SESSION_SECRET'),
  
  // API設定（オプション）
  API_KEYS_DATA: getOptionalEnv('API_KEYS_DATA'),
  DEFAULT_API_KEY: getOptionalEnv('DEFAULT_API_KEY'),
  
  // GitHub統合（オプション）
  GITHUB_CLIENT_ID: getOptionalEnv('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: getOptionalEnv('GITHUB_CLIENT_SECRET'),
  GITHUB_WEBHOOK_SECRET: getOptionalEnv('GITHUB_WEBHOOK_SECRET'),
  
  // アプリケーション（オプション）
  NEXT_PUBLIC_APP_URL: getOptionalEnv('NEXT_PUBLIC_APP_URL'),
  PORT: getOptionalEnv('PORT'),
  
  // ファイルアップロード（オプション）
  UPLOAD_LIMIT: getOptionalEnv('UPLOAD_LIMIT'),
  ALLOWED_FILE_TYPES: getOptionalEnv('ALLOWED_FILE_TYPES')
};

/**
 * 環境チェック関数
 */
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

/**
 * 個別エクスポート（互換性のため）
 */
export const NODE_ENV = env.NODE_ENV;
export const MONGODB_URI = env.MONGODB_URI;
export const MONGODB_DB = env.MONGODB_DB_NAME; // モンゴDB名をMONGODB_DBとしてエクスポート
export const JWT_SECRET = env.JWT_SECRET;
