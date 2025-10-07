/**
 * 高速・型安全ライブラリ統合エクスポート
 * 
 * - 厳格な型安全性
 * - 重複削除
 * - パフォーマンス最適化
 * - 一貫したAPI提供
 */

// ============================================================================
// コア機能（型定義、エラー、ユーティリティ）
// ============================================================================
export * from './core';

// ============================================================================
// API機能（個別エクスポート）
// ============================================================================
export { apiClient } from './api';
export type { ValidationSchema } from './api';

// ============================================================================
// 検索機能（最適化済み）
// ============================================================================
export * from './search-engine';
export * from './hooks/use-search';
export * from './ui/components/search/SearchComponents';

// ============================================================================
// データアクセス層（型安全統合）
// ============================================================================
export { PostRepository } from './data/repositories/post-repository';
export { UserRepository } from './data/repositories/user-repository';
export { CommentRepository } from './data/repositories/comment-repository';
export { PageRepository } from './data/repositories/page-repository';
export { SettingsRepository } from './data/repositories/settings-repository';

// ============================================================================
// データベース接続（統合・高速・型安全）
// ============================================================================
export {
  getDatabase,
  COLLECTIONS,
  checkDatabaseConnection,
  getDatabaseStats,
  getConnectionWithMetrics
} from './data/connections/mongodb';

// 型定義エクスポート
export type { Db, MongoClient, CollectionName } from './data/connections/mongodb';

// ============================================================================
// ビジネスロジック（型安全）
// ============================================================================
export * from './auth';
export * from './env';
export * from './github';

export * from './ui/hooks/navigation-hooks';
export * from './admin-hooks';
export * from './ui/hooks/auth-hooks';

// ============================================================================
// 統合型定義（重複を避けるため個別エクスポート）
// ============================================================================
export type { 
  PaginatedResult,
  HomePage,
  GlobalStyles 
} from './unified-types';
