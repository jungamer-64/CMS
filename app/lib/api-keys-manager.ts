import { getDatabase, COLLECTIONS } from '@/app/lib/mongodb';
import { ApiKey, ApiKeyPermissions, ApiKeyInput } from '@/app/lib/types';
import crypto from 'crypto';

export class ApiKeyManager {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<ApiKey>(COLLECTIONS.API_KEYS);
  }

  // 指定ユーザーの全APIキーを取得
  static async getApiKeysForUser(userId: string): Promise<ApiKey[]> {
    const collection = await this.getCollection();
    // isActiveなAPIキーのみ返す
    const apiKeys = await collection.find({ userId, isActive: true }).toArray();
    return apiKeys;
  }

  // ユーザーのAPIキーを取得

  // ユーザーのAPIキーを取得
  static async getUserApiKey(userId: string): Promise<ApiKey | null> {
    const collection = await this.getCollection();
    const apiKey = await collection.findOne({ 
      userId, 
      isActive: true 
    });
    return apiKey;
  }

  // 新しいAPIキーを生成
  static async generateApiKey(userId: string, input: ApiKeyInput): Promise<ApiKey> {
    const collection = await this.getCollection();
    
    // 既存のAPIキーは無効化しない（複数有効化を許可）

    // 新しいAPIキーを生成
    const apiKey: ApiKey = {
      id: Date.now().toString(),
      userId,
      name: input.name,
      key: this.generateSecureKey(),
      permissions: input.permissions,
      createdAt: new Date(),
      isActive: true,
      expiresAt: input.expiresAt
    };

    await collection.insertOne(apiKey);
    return apiKey;
  }

  // APIキーによるユーザー認証
  static async validateApiKey(apiKey: string): Promise<{ userId: string; permissions: ApiKeyPermissions } | null> {
    const collection = await this.getCollection();
    
    const keyDoc = await collection.findOne({
      key: apiKey,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    if (!keyDoc) {
      return null;
    }

    // 最終使用日時を更新
    await collection.updateOne(
      { _id: keyDoc._id },
      { $set: { lastUsed: new Date() } }
    );

    return {
      userId: keyDoc.userId,
      permissions: keyDoc.permissions
    };
  }

  // APIキーを無効化
  static async deactivateApiKey(userId: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    const result = await collection.updateMany(
      { userId, isActive: true },
      { $set: { isActive: false } }
    );

    return result.modifiedCount > 0;
  }

  // 権限チェック
  static hasPermission(
    permissions: ApiKeyPermissions,
    resource: keyof ApiKeyPermissions,
    action: string
  ): boolean {
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') {
      return false;
    }
    return (resourcePermissions as Record<string, boolean>)[action] === true;
  }

  // セキュアなAPIキー生成
  private static generateSecureKey(): string {
    const prefix = 'ak_live_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }

  // ユーザーの権限に基づくデフォルト権限設定
  static getDefaultPermissions(userRole: 'user' | 'admin'): ApiKeyPermissions {
    if (userRole === 'admin') {
      return {
        posts: { create: true, read: true, update: true, delete: true },
        comments: { read: true, moderate: true, delete: true },
        users: { read: true, create: true, update: true, delete: false },
        settings: { read: true, update: true },
        uploads: { create: true, read: true, delete: true }
      };
    } else {
      return {
        posts: { create: true, read: true, update: false, delete: false },
        comments: { read: true, moderate: false, delete: false },
        users: { read: false, create: false, update: false, delete: false },
        settings: { read: false, update: false },
        uploads: { create: true, read: true, delete: false }
      };
    }
  }

  // APIキー使用状況の取得
  static async getApiKeyStats(userId: string): Promise<{ totalRequests: number; lastUsed?: Date } | null> {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) return null;

    return {
      totalRequests: 0, // 実装時にはログから集計
      lastUsed: apiKey.lastUsed
    };
  }
}
