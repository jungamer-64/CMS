import { Collection, ObjectId, Db } from 'mongodb';
import { getDatabase } from '../connection';

// ============================================================================
// Settings Database Model（統一パターン）
// ============================================================================

export interface SettingsDocument {
  _id?: ObjectId;
  id: string; // 'system' 固定
  siteName: string;
  siteDescription: string;
  theme: 'light' | 'dark' | 'auto';
  maintenanceMode: boolean;
  allowRegistration: boolean;
  apiAccess: boolean;
  apiKey: string;
  emailNotifications: boolean;
  maxPostsPerPage: number;
  allowComments: boolean;
  requireApproval: boolean;
  updatedAt: Date;
  updatedBy: string; // ユーザーID
}

export class SettingsModel {
  private readonly collection: Collection<SettingsDocument>;
  private readonly SYSTEM_ID = 'system';

  constructor(db: Db) {
    this.collection = db.collection<SettingsDocument>('settings');
  }

  // インデックス作成
  async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ id: 1 }, { unique: true });
    } catch (err: unknown) {
      console.warn('設定インデックス作成警告:', err instanceof Error ? err : String(err));
    }
  }

  // システム設定取得
  async getSystemSettings(): Promise<SettingsDocument | null> {
    return await this.collection.findOne({ id: this.SYSTEM_ID });
  }

  // システム設定作成/更新
  async updateSystemSettings(
    settings: Partial<Omit<SettingsDocument, '_id' | 'id' | 'updatedAt'>>,
    updatedBy: string
  ): Promise<SettingsDocument> {
    const now = new Date();
    
    const result = await this.collection.findOneAndUpdate(
      { id: this.SYSTEM_ID },
      {
        $set: {
          ...settings,
          updatedAt: now,
          updatedBy
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    if (!result) {
      throw new Error('設定の更新に失敗しました');
    }

    return result;
  }

  // デフォルト設定で初期化
  async initializeDefaults(updatedBy: string): Promise<SettingsDocument> {
    const defaultSettings: Omit<SettingsDocument, '_id' | 'updatedAt'> = {
      id: this.SYSTEM_ID,
      siteName: 'Test Website',
      siteDescription: 'A test website built with Next.js',
      theme: 'auto',
      maintenanceMode: false,
      allowRegistration: true,
      apiAccess: true,
      apiKey: 'sk-test-key-123456789',
      emailNotifications: true,
      maxPostsPerPage: 10,
      allowComments: true,
      requireApproval: false,
      updatedBy
    };

    return await this.updateSystemSettings(defaultSettings, updatedBy);
  }

  // 特定の設定値を更新
  async updateSetting<K extends keyof SettingsDocument>(
    key: K,
    value: SettingsDocument[K],
    updatedBy: string
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id: this.SYSTEM_ID },
      {
        $set: {
          [key]: value,
          updatedAt: new Date(),
          updatedBy
        }
      }
    );

    return result.modifiedCount > 0;
  }
}

// ファクトリー関数
export const createSettingsModel = async (): Promise<SettingsModel> => {
  const db = getDatabase();
  const model = new SettingsModel(db);
  await model.ensureIndexes();
  return model;
};

export default SettingsModel;
