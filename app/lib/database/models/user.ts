import { Collection, Db, ObjectId } from 'mongodb';
import { UserRole } from '../../core/types';
import { getDatabase } from '../connection';

// ============================================================================
// User Database Model（統一パターン）
// ============================================================================

export interface UserDocument {
  _id?: ObjectId;
  id: string;
  username: string;
  email: string;
  displayName: string;
  password?: string; // 作成時のみ使用
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  darkMode: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences?: Record<string, unknown>;
}

export class UserModel {
  private readonly collection: Collection<UserDocument>;

  constructor(db: Db) {
    this.collection = db.collection<UserDocument>('users');
  }

  // インデックス作成（手動で呼び出し）
  async ensureIndexes(): Promise<void> {
    try {
      // ユニークインデックス
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ username: 1 }, { unique: true });
      await this.collection.createIndex({ email: 1 }, { unique: true });

      // 検索用インデックス
      await this.collection.createIndex({ role: 1 });
      await this.collection.createIndex({ isActive: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (err: unknown) {
      console.warn('ユーザーインデックス作成警告:', err instanceof Error ? err : String(err));
    }
  }

  // ユーザー作成
  async create(userData: Omit<UserDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserDocument> {
    const now = new Date();

    // パスワードハッシュ化
    let passwordHash = userData.passwordHash;
    if (userData.password) {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(userData.password, 12);
    }

    const userDoc: UserDocument = {
      ...userData,
      passwordHash,
      createdAt: now,
      updatedAt: now
    };

    // password フィールドを削除（データベースに保存しない）
    delete userDoc.password;

    const result = await this.collection.insertOne(userDoc);
    return { ...userDoc, _id: result.insertedId };
  }

  // ID（文字列）でユーザー取得
  async findById(id: string): Promise<UserDocument | null> {
    return await this.collection.findOne({ id });
  }

  // ユーザー名でユーザー取得
  async findByUsername(username: string): Promise<UserDocument | null> {
    return await this.collection.findOne({ username });
  }

  // メールでユーザー取得
  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.collection.findOne({ email });
  }

  // 全ユーザー取得（管理者用）
  async findAll(options: {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<UserDocument[]> {
    const { role, isActive, search, page = 1, limit = 20 } = options;

    // フィルター構築
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    // ページネーション
    const skip = (page - 1) * limit;

    return await this.collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  // ユーザー更新
  async updateById(id: string, update: Partial<Omit<UserDocument, '_id' | 'id' | 'createdAt'>>): Promise<UserDocument | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
  }

  // ユーザーテーマ更新
  async updateTheme(id: string, darkMode: boolean): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id },
      { $set: { darkMode, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  // ユーザー名またはメールで検索
  async findByUsernameOrEmail(username: string, email: string): Promise<UserDocument | null> {
    return await this.collection.findOne({
      $or: [
        { username },
        { email }
      ]
    });
  }

  // ユーザー更新
  async update(id: string, updateData: Partial<Omit<UserDocument, '_id' | 'id' | 'createdAt'>>): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  // 最終ログイン時刻更新
  async updateLastLogin(id: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id },
      { $set: { lastLogin: new Date(), updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  // ユーザー削除
  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // ユーザー数カウント
  async count(filter: { role?: UserRole; isActive?: boolean } = {}): Promise<number> {
    return await this.collection.countDocuments(filter);
  }
}

// ファクトリー関数
export const createUserModel = async (): Promise<UserModel> => {
  const db = getDatabase();
  return new UserModel(db);
};

export default UserModel;
