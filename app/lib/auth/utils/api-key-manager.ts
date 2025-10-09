/**
 * API キー管理
 * LIB_COMMONIZATION_PLAN.md フェーズ3対応
 */

import { BaseError } from '../../core/errors';
import type { ApiKey, ApiKeyCreateRequest, ApiKeyPermissions } from '../../core/types/api-unified';

/**
 * API キー管理エラー
 */
export class ApiKeyError extends BaseError {
  constructor(message: string, public readonly keyId?: string) {
    super(message, 'ApiKeyError');
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      keyId: this.keyId,
      timestamp: this.timestamp,
    };
  }
}

/**
 * API キー管理クラス
 */
export class ApiKeyManager {
  // 開発用メモリストレージ
  private static apiKeys: ApiKey[] = [];

  /**
   * ユーザーのAPIキー一覧を取得
   */
  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      // 開発用: メモリから取得
      return ApiKeyManager.apiKeys.filter(key => key.userId === userId);
    } catch (err: unknown) {
      console.error('Failed to get user API keys:', err instanceof Error ? err : String(err));
      throw new ApiKeyError('APIキーの取得に失敗しました', userId);
    }
  }

  /**
   * デフォルトのパーミッション設定を取得
   */
  private static getDefaultPermissions(): ApiKeyPermissions {
    return {
      posts: { create: false, read: true, update: false, delete: false },
      comments: { read: true, create: false, update: false, moderate: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      media: { read: false, upload: false, delete: false },
      settings: { read: false, update: false },
      uploads: { create: false, read: true, delete: false },
      admin: false
    };
  }

  /**
   * 新しいAPIキーを作成
   */
  static async createApiKey(
    userId: string,
    request: ApiKeyCreateRequest
  ): Promise<ApiKey> {
    try {
      const keyValue = ApiKeyManager.generateApiKey();
      const now = new Date();

      const apiKey: ApiKey = {
        id: `ak_${now.getTime()}_${Math.random().toString(36).substring(2, 9)}`,
        name: request.name,
        key: keyValue,
        userId,
        permissions: request.permissions || ApiKeyManager.getDefaultPermissions(),
        createdAt: now,
        updatedAt: now,
        lastUsed: undefined,
        isActive: true,
      };

      // 開発用: メモリに保存
      ApiKeyManager.apiKeys.push(apiKey);

      return apiKey;
    } catch (err: unknown) {
      console.error('Failed to create API key:', err instanceof Error ? err : String(err));
      throw new ApiKeyError('APIキーの作成に失敗しました');
    }
  }

  /**
   * APIキーを削除
   */
  static async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      // 開発用: メモリから削除
      const initialLength = ApiKeyManager.apiKeys.length;
      ApiKeyManager.apiKeys = ApiKeyManager.apiKeys.filter(
        key => !(key.id === keyId && key.userId === userId)
      );
      return ApiKeyManager.apiKeys.length < initialLength;
    } catch (err: unknown) {
      console.error('Failed to delete API key:', err instanceof Error ? err : String(err));
      throw new ApiKeyError('APIキーの削除に失敗しました', keyId);
    }
  }

  /**
   * APIキーを無効化
   */
  static async deactivateApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      // メモリストレージでの無効化実装
      const apiKey = ApiKeyManager.apiKeys.find(
        key => key.id === keyId && key.userId === userId
      );

      if (!apiKey) {
        return false;
      }

      apiKey.isActive = false;
      apiKey.updatedAt = new Date();
      return true;
    } catch (err: unknown) {
      console.error('Failed to deactivate API key:', err instanceof Error ? err : String(err));
      throw new ApiKeyError('APIキーの無効化に失敗しました', keyId);
    }
  }

  /**
   * APIキーの検証
   */
  static async validateApiKey(keyValue: string): Promise<ApiKey | null> {
    try {
      // メモリストレージでの検証実装
      const apiKey = ApiKeyManager.apiKeys.find(
        key => key.key === keyValue && key.isActive
      );

      if (!apiKey) {
        return null;
      }

      // 使用履歴を更新
      await ApiKeyManager.updateLastUsed(apiKey.id);

      return apiKey;
    } catch (err: unknown) {
      console.error('Failed to validate API key:', err instanceof Error ? err : String(err));
      return null;
    }
  }

  /**
   * APIキーを生成
   */
  private static generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk-';

    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * APIキーの使用履歴を更新
   */
  static async updateLastUsed(keyId: string): Promise<void> {
    try {
      // メモリストレージでの最終使用日時更新実装
      const apiKey = ApiKeyManager.apiKeys.find(key => key.id === keyId);

      if (apiKey) {
        apiKey.lastUsed = new Date();
        apiKey.updatedAt = new Date();
      }
    } catch (err: unknown) {
      console.error('Failed to update API key last used:', err instanceof Error ? err : String(err));
    }
  }

  /**
   * APIキーの統計情報を取得
   */
  static async getApiKeyStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const apiKeys = await ApiKeyManager.getUserApiKeys(userId);
      const active = apiKeys.filter(key => key.isActive).length;

      return {
        total: apiKeys.length,
        active,
        inactive: apiKeys.length - active,
      };
    } catch (err: unknown) {
      console.error('Failed to get API key stats:', err instanceof Error ? err : String(err));
      return { total: 0, active: 0, inactive: 0 };
    }
  }
}
