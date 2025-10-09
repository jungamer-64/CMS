/**
 * コメントリポジトリ
 * LIB_COMMONIZATION_PLAN.md フェーズ5対応
 *       // フィルタークエリ構築
      const query = {} as Filter<Comment>;

      // 削除済みコメントのフィルタ
      if (!includeDeleted) {
        query.isDeleted = { $ne: true } as any;
      }

      // 投稿スラッグフィルタ
      if (postSlug) {
        query.postSlug = postSlug as any;
      }

      // 著者メールフィルタ
      if (authorEmail) {
        query.authorEmail = authorEmail as any;
      }tsから移行
 */

import { Collection, Filter } from 'mongodb';
import type { ApiResponse, Comment } from '../../core/types';
import { getDatabase } from '../connections';
import { BaseRepository, type BaseEntity, type RepositoryFilters, type RepositoryResult } from './base-repository';

// コメント入力型
export interface CommentInput {
  readonly postSlug: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly content: string;
}

// コメント用フィルタの拡張
export interface CommentFilters extends RepositoryFilters {
  readonly postSlug?: string;
  readonly authorEmail?: string;
  readonly startDate?: string | Date;
  readonly endDate?: string | Date;
  readonly includeDeleted?: boolean;
}

// Commentエンティティのベース化
interface CommentEntity extends BaseEntity {
  readonly postSlug: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly content: string;
  readonly isApproved: boolean;
  readonly isDeleted?: boolean;
}

export class CommentRepository extends BaseRepository<CommentEntity, CommentInput, Partial<CommentInput>, CommentFilters> {
  private async getCollection(): Promise<Collection<Comment>> {
    const db = await getDatabase();
    return db.collection<Comment>('comments');
  }

  async findAll(filters: CommentFilters = {}): Promise<ApiResponse<RepositoryResult<CommentEntity>>> {
    try {
      const collection = await this.getCollection();
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        postSlug,
        authorEmail,
        startDate,
        endDate,
        includeDeleted = false
      } = filters;

      // フィルタークエリ構築
      const query: Filter<Comment> = {};

      // 削除済みコメントのフィルタ
      if (!includeDeleted) {
        Object.assign(query, { isDeleted: { $ne: true } });
      }

      // 投稿スラッグフィルタ
      if (postSlug) {
        Object.assign(query, { postSlug });
      }

      // 作者メールフィルタ
      if (authorEmail) {
        Object.assign(query, { authorEmail });
      }

      // 検索フィルタ
      const searchRegex = this.buildSearchRegex(search);
      if (searchRegex) {
        query.$or = [
          { authorName: searchRegex },
          { content: searchRegex },
          { authorEmail: searchRegex }
        ];
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
      const [total, comments] = await Promise.all([
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
          data: comments.map(this.transformToEntity),
          pagination,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメント一覧の取得に失敗しました',
      };
    }
  }

  async findById(id: string): Promise<ApiResponse<CommentEntity>> {
    try {
      const collection = await this.getCollection();
      const comment = await collection.findOne({
        id,
        isDeleted: { $ne: true }
      });

      if (!comment) {
        return {
          success: false,
          error: 'コメントが見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(comment),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメントの取得に失敗しました',
      };
    }
  }

  async create(data: CommentInput): Promise<ApiResponse<CommentEntity>> {
    try {
      const collection = await this.getCollection();

      const id = crypto.randomUUID();
      const comment: Comment = {
        id,
        postSlug: data.postSlug,
        authorName: data.authorName.trim(),
        authorEmail: data.authorEmail.trim().toLowerCase(),
        content: data.content.trim(),
        createdAt: new Date(),
        isDeleted: false,
        isApproved: false,
      };

      const result = await collection.insertOne(comment);
      const createdComment = { ...comment, _id: result.insertedId.toString() };

      return {
        success: true,
        data: this.transformToEntity(createdComment),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメントの作成に失敗しました',
      };
    }
  }

  async update(id: string, data: Partial<CommentInput>): Promise<ApiResponse<CommentEntity>> {
    try {
      const collection = await this.getCollection();

      const updateData: Record<string, unknown> = {};

      if (data.content !== undefined) {
        updateData.content = data.content.trim();
      }
      if (data.authorName !== undefined) {
        updateData.authorName = data.authorName.trim();
      }
      if (data.authorEmail !== undefined) {
        updateData.authorEmail = data.authorEmail.trim().toLowerCase();
      }

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: '更新するデータがありません',
        };
      }

      const result = await collection.findOneAndUpdate(
        { id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return {
          success: false,
          error: 'コメントが見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(result),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメントの更新に失敗しました',
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();

      // ソフトデリート
      const result = await collection.updateOne(
        { id },
        { $set: { isDeleted: true } }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'コメントが見つかりません',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメントの削除に失敗しました',
      };
    }
  }

  // 投稿に紐づくコメントの取得
  async findByPostSlug(postSlug: string, includeDeleted = false): Promise<ApiResponse<CommentEntity[]>> {
    try {
      const collection = await this.getCollection();

      const query: Filter<Comment> = { postSlug, isApproved: true };
      if (!includeDeleted) {
        Object.assign(query, { isDeleted: { $ne: true } });
      }

      const comments = await collection
        .find(query)
        .sort({ createdAt: 1 })
        .toArray();

      return {
        success: true,
        data: comments.map(this.transformToEntity.bind(this)),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメントの取得に失敗しました',
      };
    }
  }

  // RepositoryResult形式で投稿のコメントを取得
  async findByPostSlugWithPagination(postSlug: string, includeDeleted = false): Promise<ApiResponse<RepositoryResult<CommentEntity>>> {
    try {
      const collection = await this.getCollection();

      const query: Record<string, unknown> = { postSlug };
      if (!includeDeleted) {
        query.isDeleted = { $ne: true };
      }

      const total = await collection.countDocuments(query);
      const comments = await collection
        .find(query)
        .sort({ createdAt: 1 })
        .toArray();

      const result: RepositoryResult<CommentEntity> = {
        data: comments.map(this.transformToEntity.bind(this)),
        pagination: {
          page: 1,
          limit: comments.length,
          total,
          totalPages: 1,
        },
      };

      return {
        success: true,
        data: result,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメントの取得に失敗しました',
      };
    }
  }

  // エンティティ変換
  private transformToEntity(comment: Comment): CommentEntity {
    return {
      _id: comment._id,
      id: comment.id,
      postSlug: comment.postSlug,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      content: comment.content,
      isApproved: comment.isApproved,
      createdAt: comment.createdAt,
      isDeleted: comment.isDeleted,
    };
  }

  // ============================================================================
  // 追加ヘルパーメソッド
  // ============================================================================

  // コメントを承認
  async approve(id: string): Promise<ApiResponse<CommentEntity>> {
    try {
      const collection = await this.getCollection();

      const result = await collection.findOneAndUpdate(
        { id, isDeleted: { $ne: true } },
        {
          $set: {
            isApproved: true,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        return {
          success: false,
          error: 'コメントが見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(result),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'コメントの承認に失敗しました',
      };
    }
  }

  // コレクションへのアクセス（下位互換性のため）
  get collection() {
    return this.getCollection();
  }

  // すべてのコメントを取得
  async getAll(): Promise<ApiResponse<CommentEntity[]>> {
    try {
      const collection = await this.collection;
      const comments = await collection.find({}).toArray();
      return { success: true, data: comments };
    } catch (err: unknown) {
      console.error('コメント取得エラー:', err instanceof Error ? err : String(err));
      return { success: false, error: 'コメント取得に失敗しました' };
    }
  }
}

// デフォルトインスタンス
export const commentRepository = new CommentRepository();
