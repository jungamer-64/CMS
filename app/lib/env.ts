/**
 * 環境変数の設定と検証
 */

// 必須の環境変数を定義
const requiredEnvVars = {
  MONGODB_URI: process.env.MONGODB_URI as string,
  MONGODB_DB: process.env.MONGODB_DB as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
} as const;

// オプショナルな環境変数を定義
const optionalEnvVars = {
  API_KEYS_DATA: process.env.API_KEYS_DATA || '{"keys":[]}',
  DEFAULT_API_KEY: process.env.DEFAULT_API_KEY || 'default-test-key',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // GitHub設定
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_OWNER: process.env.GITHUB_OWNER || 'jungamer-64',
  GITHUB_REPO: process.env.GITHUB_REPO || 'test-website',
  GITHUB_API_URL: process.env.GITHUB_API_URL || 'https://api.github.com',
} as const;

// 必須環境変数の検証
function validateRequiredEnvVars() {
  const missingVars: string[] = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `必須の環境変数が設定されていません: ${missingVars.join(', ')}\n` +
      '.envファイルを確認してください。'
    );
  }
}

// 開発環境でのみ検証を実行
if (process.env.NODE_ENV !== 'production') {
  validateRequiredEnvVars();
}

// 型安全な環境変数のエクスポート
export const env = {
  ...requiredEnvVars,
  ...optionalEnvVars,
} as const;

// 個別エクスポート（後方互換性のため）
export const {
  MONGODB_URI,
  MONGODB_DB,
  JWT_SECRET,
  API_KEYS_DATA,
  DEFAULT_API_KEY,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  ADMIN_EMAIL,
  NODE_ENV,
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_API_URL,
} = env;

// 型定義
export type EnvVars = typeof env;
