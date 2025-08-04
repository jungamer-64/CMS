/**
 * 統合MongoDB接続システム
 * 
 * - 厳格な型安全性
 * - コネクションプール最適化
 * - パフォーマンス監視
 * - エラーハンドリング強化
 * - 後方互換性削除済み
 */

import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { MONGODB_URI, MONGODB_DB, NODE_ENV } from '../../core/config/environment';

// 型定義の再エクスポート
export type { Db, MongoClient } from 'mongodb';

// 型安全な環境設定
interface DatabaseConfig {
  readonly uri: string;
  readonly dbName: string;
  readonly isDevelopment: boolean;
}

interface DatabaseStats {
  readonly collections: number;
  readonly dataSize: number;
  readonly storageSize: number;
  readonly indexes: number;
  readonly indexSize: number;
}

interface DatabaseStatsResponse {
  readonly success: boolean;
  readonly data?: DatabaseStats;
  readonly error?: string;
}

// 設定バリデーション
const validateConfig = (): DatabaseConfig => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI環境変数が設定されていません');
  }
  if (!MONGODB_DB) {
    throw new Error('MONGODB_DB環境変数が設定されていません');
  }
  
  return {
    uri: MONGODB_URI,
    dbName: MONGODB_DB,
    isDevelopment: NODE_ENV === 'development'
  } as const;
};

const config = validateConfig();

// MongoDB接続オプション（パフォーマンス最適化）
const mongoOptions: MongoClientOptions = {
  maxPoolSize: config.isDevelopment ? 5 : 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority'
} as const;

// グローバルクライアント管理（開発環境での再利用）
interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

let client: MongoClient;

const clientPromise: Promise<MongoClient> = (() => {
  if (config.isDevelopment) {
    // 開発環境: ホットリロード時にクライアントを再利用
    const globalWithMongo = global as typeof globalThis & GlobalWithMongo;

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(config.uri, mongoOptions);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    // 本番環境: 新しいクライアントを作成
    client = new MongoClient(config.uri, mongoOptions);
    return client.connect();
  }
})();

/**
 * 型安全なデータベース取得
 */
export const getDatabase = async (): Promise<Db> => {
  const connectedClient = await clientPromise;
  return connectedClient.db(config.dbName);
};

// Collection names（型安全定数）
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  COMMENTS: 'comments',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  API_KEYS: 'api_keys',
  STATIC_PAGES: 'static_pages',
  SETTINGS: 'settings',
  HOMEPAGE: 'homepage',
  MEDIA: 'media'
} as const;

// コレクション名の型安全性確保
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

/**
 * パフォーマンス監視付きコネクション取得
 */
export const getConnectionWithMetrics = async () => {
  const startTime = performance.now();
  const client = await clientPromise;
  const endTime = performance.now();
  
  if (config.isDevelopment) {
    console.debug(`MongoDB connection time: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return client;
};

/**
 * 高速接続状態チェック
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const connectedClient = await clientPromise;
    await connectedClient.db(config.dbName).admin().ping();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

/**
 * 型安全なデータベース統計取得
 */
export const getDatabaseStats = async (): Promise<DatabaseStatsResponse> => {
  try {
    const db = await getDatabase();
    const stats = await db.stats();
    return {
      success: true,
      data: {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database stats retrieval failed',
    };
  }
};

export default clientPromise;
