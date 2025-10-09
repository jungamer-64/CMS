/**
 * ユーザーリポジトリ
 * LIB_COMMONIZATION_PLAN.md フェーズ5対応
 *
 * 既存のusers.tsから移行
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Collection, Filter, ObjectId } from 'mongodb';
import type { ApiResponse, User, UserInput, UserRole } from '../../core/types';
import { getDatabase } from '../connections';
import { BaseRepository, type BaseEntity, type RepositoryFilters, type RepositoryResult } from './base-repository';

// ユーザー用フィルタの拡張
export interface UserFilters extends RepositoryFilters {
  readonly role?: UserRole;
  readonly isActive?: boolean;
  readonly darkMode?: boolean;
  readonly startDate?: string | Date;
  readonly endDate?: string | Date;
}

// Userエンティティのベース化
interface UserEntity extends BaseEntity {
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly darkMode?: boolean;
  readonly isActive?: boolean;
}

export class UserRepository extends BaseRepository<UserEntity, UserInput, Partial<UserInput>, UserFilters> {
  private readonly saltRounds = 12;

  private async getCollection(): Promise<Collection<User>> {
    const db = await getDatabase();
    return db.collection<User>('users');
  }

  async findAll(filters: UserFilters = {}): Promise<ApiResponse<RepositoryResult<UserEntity>>> {
    try {
      const collection = await this.getCollection();
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        role,
        isActive,
        darkMode,
        startDate,
        endDate
      } = filters;

      // フィルタークエリ構築
      const query: Filter<User> = {};

      // 検索フィルタ
      const searchRegex = this.buildSearchRegex(search);
      if (searchRegex) {
        query.$or = [
          { username: searchRegex },
          { email: searchRegex },
          { displayName: searchRegex }
        ];
      }

      // ロールフィルタ
      if (role) {
        Object.assign(query, { role });
      }

      // アクティブフィルタ
      if (typeof isActive === 'boolean') {
        Object.assign(query, { isActive });
      }

      // ダークモードフィルタ
      if (typeof darkMode === 'boolean') {
        Object.assign(query, { darkMode });
      }

      // 日付範囲フィルタ
      if (startDate || endDate) {
        const dateFilter: Record<string, unknown> = {};
        if (startDate) {
          dateFilter.$gte = this.formatDateFilter(startDate);
        }
        if (endDate) {
          dateFilter.$lte = this.formatDateFilter(endDate);
        }
        Object.assign(query, { createdAt: dateFilter });
      }

      // ソート構築
      const sort = this.buildSortQuery(sortBy, sortOrder);

      // 総数とデータを並行取得
      const [total, users] = await Promise.all([
        collection.countDocuments(query),
        collection
          .find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray()
      ]);

      const pagination = this.buildPagination(total, page, limit);

      return {
        success: true,
        data: {
          data: users.map(this.transformToEntity),
          pagination,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました',
      };
    }
  }

  async findById(id: string): Promise<ApiResponse<UserEntity>> {
    try {
      const collection = await this.getCollection();

      // 複数のクエリパターンを試す
      const queries = [
        { id },                    // カスタムIDフィールド
        { username: id },          // ユーザー名
        { email: id },             // メールアドレス
        { _id: id },               // 文字列形式のMongoID
        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId形式
      ].filter(Boolean);

      let user = null;
      for (const query of queries) {
        user = await collection.findOne(query as Filter<User>);
        if (user) {
          break;
        }
      }

      if (!user) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(user),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'ユーザーの取得に失敗しました',
      };
    }
  }

  async create(data: UserInput): Promise<ApiResponse<UserEntity>> {
    try {
      const collection = await this.getCollection();

      // 重複チェック
      const duplicateQuery: Filter<User> = {
        $or: [
          { username: data.username },
          { email: data.email }
        ]
      };
      const existingUser = await collection.findOne(duplicateQuery);

      if (existingUser) {
        return {
          success: false,
          error: 'ユーザー名またはメールアドレスが既に使用されています',
        };
      }

      // パスワードハッシュ化
      const passwordHash = await bcrypt.hash(data.password, this.saltRounds);

      const id = crypto.randomUUID();
      const user: User = {
        id,
        username: data.username,
        email: data.email,
        passwordHash,
        displayName: data.displayName,
        role: data.role || 'user',
        darkMode: data.darkMode || false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(user);
      const createdUser = { ...user, _id: result.insertedId.toString() };

      return {
        success: true,
        data: this.transformToEntity(createdUser),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'ユーザーの作成に失敗しました',
      };
    }
  }

  async update(id: string, data: Partial<UserInput>): Promise<ApiResponse<UserEntity>> {
    try {
      const collection = await this.getCollection();

      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      // パスワードが含まれている場合はハッシュ化
      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, this.saltRounds);
        delete updateData.password;
      }

      // 複数のクエリパターンを試す
      const queries = [
        { id },                    // カスタムIDフィールド
        { username: id },          // ユーザー名
        { _id: id },               // 文字列形式のMongoID
        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId形式
      ].filter(Boolean);

      let result = null;
      for (const query of queries) {
        result = await collection.findOneAndUpdate(
          query as Filter<User>,
          { $set: updateData },
          { returnDocument: 'after' }
        );
        if (result) {
          break;
        }
      }

      if (!result) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(result),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ユーザーの更新に失敗しました',
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();

      // 複数のクエリパターンを試す
      const queries = [
        { id },                    // カスタムIDフィールド
        { username: id },          // ユーザー名
        { _id: id },               // 文字列形式のMongoID
        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId形式
      ].filter(Boolean);

      let result = null;
      for (const query of queries) {
        // ソフトデリート（isActiveをfalseに）
        result = await collection.updateOne(
          query as Filter<User>,
          {
            $set: {
              isActive: false,
              updatedAt: new Date()
            }
          }
        );
        if (result.matchedCount > 0) {
          break;
        }
      }

      if (!result || result.matchedCount === 0) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ユーザーの削除に失敗しました',
      };
    }
  }

  // 完全削除メソッド
  async permanentDelete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();

      // 複数のクエリパターンを試す
      const queries = [
        { id },                    // カスタムIDフィールド
        { username: id },          // ユーザー名
        { _id: id },               // 文字列形式のMongoID
        ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null // ObjectId形式
      ].filter(Boolean);

      let result = null;
      for (const query of queries) {
        // ハードデリート（完全削除）
        result = await collection.deleteOne(query as Filter<User>);
        if (result.deletedCount > 0) {
          break;
        }
      }

      if (!result || result.deletedCount === 0) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ユーザーの完全削除に失敗しました',
      };
    }
  }

  // パスワード検証
  async verifyPassword(id: string, password: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();
      const verifyQuery: Filter<User> = {
        $or: [{ id }, { username: id }, { email: id }],
        isActive: { $ne: false }
      };
      const user = await collection.findOne(verifyQuery);

      if (!user) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      return {
        success: true,
        data: isValid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'パスワード検証に失敗しました',
      };
    }
  }

  // ============================================================================
  // 追加ヘルパーメソッド
  // ============================================================================

  // ユーザー名でユーザーを検索
  async findByUsername(username: string): Promise<ApiResponse<UserEntity>> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ username });

      if (!user) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(user),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ユーザー検索に失敗しました',
      };
    }
  }

  // メールでユーザーを検索
  async findByEmail(email: string): Promise<ApiResponse<UserEntity>> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ email });

      if (!user) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(user),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ユーザー検索に失敗しました',
      };
    }
  }

  // 認証用: ユーザー名とパスワードでユーザーを認証
  async authenticateUser(username: string, password: string): Promise<ApiResponse<UserEntity>> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({
        username,
        isActive: { $ne: false }
      });

      if (!user) {
        return {
          success: false,
          error: 'ユーザー名またはパスワードが正しくありません',
        };
      }

      // パスワードを検証
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return {
          success: false,
          error: 'ユーザー名またはパスワードが正しくありません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(user),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ユーザー認証に失敗しました',
      };
    }
  }

  // 最終ログイン時刻を更新
  async updateLastLogin(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { id: userId },
        {
          $set: { lastLoginAt: new Date() },
          $currentDate: { updatedAt: true }
        }
      );

      return {
        success: true,
        data: result.modifiedCount > 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ログイン時刻更新に失敗しました',
      };
    }
  }

  // パスワードを変更
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ApiResponse<boolean>> {
    try {
      // 現在のパスワードを検証
      const verifyResult = await this.verifyPassword(userId, currentPassword);
      if (!verifyResult.success || !verifyResult.data) {
        return {
          success: false,
          error: '現在のパスワードが正しくありません',
        };
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // パスワードを更新
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { id: userId },
        {
          $set: { passwordHash: hashedPassword },
          $currentDate: { updatedAt: true }
        }
      );

      return {
        success: true,
        data: result.modifiedCount > 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'パスワード変更に失敗しました',
      };
    }
  }

  // ダークモード設定を更新
  async updateDarkMode(userId: string, darkMode: boolean): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { id: userId },
        {
          $set: { darkMode },
          $currentDate: { updatedAt: true }
        }
      );

      return {
        success: true,
        data: result.modifiedCount > 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ダークモード更新に失敗しました',
      };
    }
  }

  // ダークモード設定を取得
  async getDarkMode(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ id: userId }, { projection: { darkMode: 1 } });

      if (!user) {
        return {
          success: false,
          error: 'ユーザーが見つかりません',
        };
      }

      return {
        success: true,
        data: user.darkMode || false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ダークモード取得に失敗しました',
      };
    }
  }

  // コレクションへのアクセス（下位互換性のため）
  get collection() {
    return this.getCollection();
  }

  // エンティティ変換（パスワードハッシュを除外）
  private transformToEntity(user: User): UserEntity {
    return {
      _id: user._id,
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      darkMode: user.darkMode,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// デフォルトインスタンス
export const userRepository = new UserRepository();
