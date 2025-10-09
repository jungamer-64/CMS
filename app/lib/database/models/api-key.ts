import { Collection, Db, ObjectId } from 'mongodb';
import { getDatabase } from '../connection';

// ============================================================================
// APIキー Database Model（統一パターン）
// ============================================================================

export interface ApiKeyDocument {
  _id?: ObjectId;
  id: string; // ユニークID
  name: string;
  key: string; // 暗号化されたAPIキー
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  createdBy: string; // ユーザーID
  lastUsed?: Date;
  usageCount: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export class ApiKeyModel {
  private readonly collection: Collection<ApiKeyDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ApiKeyDocument>('api_keys');
  }

  // インデックス作成
  async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ key: 1 }, { unique: true });
      await this.collection.createIndex({ createdBy: 1 });
      await this.collection.createIndex({ isActive: 1 });
    } catch (err: unknown) {
      console.warn('APIキーインデックス作成警告:', err instanceof Error ? err : String(err));
    }
  }

  // 全APIキー取得（管理者用）
  async findAll(): Promise<ApiKeyDocument[]> {
    return await this.collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  // アクティブなAPIキー取得
  async findActive(): Promise<ApiKeyDocument[]> {
    return await this.collection.find({ isActive: true }).sort({ createdAt: -1 }).toArray();
  }

  // IDでAPIキー取得
  async findById(id: string): Promise<ApiKeyDocument | null> {
    return await this.collection.findOne({ id });
  }

  // キーでAPIキー取得（認証用）
  async findByKey(key: string): Promise<ApiKeyDocument | null> {
    return await this.collection.findOne({ key, isActive: true });
  }

  // ユーザーのAPIキー取得
  async findByCreator(createdBy: string): Promise<ApiKeyDocument[]> {
    return await this.collection.find({ createdBy }).sort({ createdAt: -1 }).toArray();
  }

  // APIキー作成
  async create(data: Omit<ApiKeyDocument, '_id' | 'createdAt' | 'usageCount' | 'lastUsed'>): Promise<ApiKeyDocument> {
    const now = new Date();
    const apiKeyDoc: Omit<ApiKeyDocument, '_id'> = {
      ...data,
      createdAt: now,
      usageCount: 0
    };

    const result = await this.collection.insertOne(apiKeyDoc as ApiKeyDocument);

    const created = await this.collection.findOne({ _id: result.insertedId });
    if (!created) {
      throw new Error('APIキーの作成に失敗しました');
    }

    return created;
  }

  // APIキー更新
  async update(id: string, updates: Partial<Omit<ApiKeyDocument, '_id' | 'id' | 'createdAt' | 'createdBy'>>): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id },
      { $set: updates }
    );

    return result.modifiedCount > 0;
  }

  // APIキー削除
  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // 使用回数を増加
  async incrementUsage(key: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { key, isActive: true },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsed: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  // 統計情報取得
  async getStats() {
    const total = await this.collection.countDocuments();
    const active = await this.collection.countDocuments({ isActive: true });
    const inactive = total - active;

    return {
      total,
      active,
      inactive
    };
  }
}

// ファクトリー関数
export const createApiKeyModel = async (): Promise<ApiKeyModel> => {
  const db = getDatabase();
  const model = new ApiKeyModel(db);
  await model.ensureIndexes();
  return model;
};

export default ApiKeyModel;
