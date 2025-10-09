/**
 * 投稿リポジトリ
 * LIB_COMMONIZATION_PLAN.md フェーズ5対応
 *
 * 既存のposts.tsから移行
 */

import { Collection } from 'mongodb';
import type { ApiResponse, Post, PostInput, PostType } from '../../core/types';
import { getDatabase } from '../connections';
import { BaseRepository, type BaseEntity, type RepositoryFilters, type RepositoryResult } from './base-repository';

// 投稿用フィルタの拡張
export interface PostFilters extends RepositoryFilters {
  readonly type?: PostType;
  readonly author?: string;
  readonly startDate?: string | Date;
  readonly endDate?: string | Date;
  readonly tags?: readonly string[];
  readonly includeDeleted?: boolean;
}

// Postエンティティのベース化
interface PostEntity extends BaseEntity {
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly isDeleted?: boolean;
  readonly media?: readonly string[];
}

export class PostRepository extends BaseRepository<PostEntity, PostInput, Partial<PostInput>, PostFilters> {
  private async getCollection(): Promise<Collection<Post>> {
    const db = await getDatabase();
    return db.collection<Post>('posts');
  }

  async findAll(filters: PostFilters = {}): Promise<ApiResponse<RepositoryResult<PostEntity>>> {
    try {
      const collection = await this.getCollection();
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        type = 'published',
        author,
        startDate,
        endDate,
        tags,
        includeDeleted = false
      } = filters;

      // フィルタークエリ構築
      const query: Record<string, unknown> = {};

      // 削除フィルタ
      if (!includeDeleted) {
        query.isDeleted = { $ne: true };
      } else if (type === 'deleted') {
        query.isDeleted = true;
      }
      // includeDeleted=true かつ type!=='deleted' の場合は削除済みも含む

      // 検索フィルタ
      const searchRegex = this.buildSearchRegex(search);
      if (searchRegex) {
        query.$or = [
          { title: searchRegex },
          { content: searchRegex },
          { author: searchRegex }
        ];
      }

      // 作者フィルタ（論理演算サポート）
      if (author) {
        const authorFilter = this.buildAuthorFilter(author);
        if (authorFilter) {
          query.author = authorFilter;
        }
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
        query.createdAt = dateFilter;
      }

      // タグフィルタ
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      // ソート構築
      const sort = this.buildSortQuery(sortBy, sortOrder);

      // 総数とデータを並行取得
      const [total, posts] = await Promise.all([
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
          data: posts.map(this.transformToEntity),
          pagination,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿一覧の取得に失敗しました',
      };
    }
  }

  async findById(id: string): Promise<ApiResponse<PostEntity>> {
    try {
      const collection = await this.getCollection();
      const post = await collection.findOne({
        $or: [{ id }, { slug: id }],
        isDeleted: { $ne: true }
      });

      if (!post) {
        return {
          success: false,
          error: '投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(post),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の取得に失敗しました',
      };
    }
  }

  async create(data: PostInput): Promise<ApiResponse<PostEntity>> {
    try {
      const collection = await this.getCollection();

      // 一意なIDとスラッグを生成
      const id = crypto.randomUUID();
      const slug = data.slug || this.generateSlugFromTitle(data.title);

      const post: Post = {
        id,
        ...data,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(post);
      const createdPost = { ...post, _id: result.insertedId.toString() };

      return {
        success: true,
        data: this.transformToEntity(createdPost),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の作成に失敗しました',
      };
    }
  }

  async update(id: string, data: Partial<PostInput>): Promise<ApiResponse<PostEntity>> {
    try {
      const collection = await this.getCollection();

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const result = await collection.findOneAndUpdate(
        { $or: [{ id }, { slug: id }] },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return {
          success: false,
          error: '投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(result),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の更新に失敗しました',
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();

      // ソフトデリート
      const result = await collection.updateOne(
        { $or: [{ id }, { slug: id }] },
        {
          $set: {
            isDeleted: true,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: '投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の削除に失敗しました',
      };
    }
  }

  // ============================================================================
  // 追加ヘルパーメソッド
  // ============================================================================

  // スラッグで投稿を検索
  async findBySlug(slug: string): Promise<ApiResponse<PostEntity>> {
    try {
      const collection = await this.getCollection();
      const post = await collection.findOne({ slug, isDeleted: { $ne: true } });

      if (!post) {
        return {
          success: false,
          error: '投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(post),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿検索に失敗しました',
      };
    }
  }

  // スラッグで投稿を更新
  async updateBySlug(slug: string, data: Partial<PostInput>): Promise<ApiResponse<PostEntity>> {
    try {
      const collection = await this.getCollection();

      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      const result = await collection.findOneAndUpdate(
        { slug, isDeleted: { $ne: true } },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return {
          success: false,
          error: '投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: this.transformToEntity(result),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の更新に失敗しました',
      };
    }
  }

  // スラッグで投稿を削除
  async deleteBySlug(slug: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();

      const result = await collection.updateOne(
        { slug, isDeleted: { $ne: true } },
        {
          $set: {
            isDeleted: true,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: '投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: result.modifiedCount > 0,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の削除に失敗しました',
      };
    }
  }

  // 投稿を復元(IDベース)
  async restore(id: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();

      const result = await collection.updateOne(
        { $or: [{ id }, { slug: id }], isDeleted: true },
        {
          $unset: { isDeleted: "" },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: '削除された投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: result.modifiedCount > 0,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の復元に失敗しました',
      };
    }
  }

  // 投稿を完全削除（IDベース）
  async permanentlyDelete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();

      const result = await collection.deleteOne(
        { $or: [{ id }, { slug: id }] }
      );

      if (result.deletedCount === 0) {
        return {
          success: false,
          error: '投稿が見つかりません',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '投稿の完全削除に失敗しました',
      };
    }
  }

  // コレクションへのアクセス（下位互換性のため）
  get collection() {
    return this.getCollection();
  }

  // スラッグ生成（既存実装から移行）
  private generateSlugFromTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/(?:^-|-$)/g, '') || crypto.randomUUID();
  }

  // エンティティ変換
  private transformToEntity(post: Post): PostEntity {
    return {
      _id: post._id,
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      author: post.author,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isDeleted: post.isDeleted,
      media: post.media,
    };
  }

  // 作者フィルター構築（論理演算サポート）
  private buildAuthorFilter(author: string): object | string {
    if (!author) return author;

    // 論理演算モードかチェック（!で開始する場合）
    if (author.startsWith('!')) {
      return this.parseLogicalAuthorExpression(author);
    }

    // 通常モードでもOR演算をサポート（例: "admin|user|guest"）
    if (author.includes('|')) {
      const authors = author.split('|').map(a => a.trim()).filter(a => a);
      return { $in: authors };
    }

    // 通常の完全一致
    return author.trim();
  }

  // 論理演算式の解析
  private parseLogicalAuthorExpression(expression: string): object | string {
    // !を除去してから処理
    const cleanExpression = expression.substring(1).trim();

    // OR演算子をチェック（例: "!admin|user|guest"）
    if (cleanExpression.includes('|')) {
      const authors = cleanExpression.split('|').map(a => a.trim()).filter(a => a);
      // NOT OR: adminでもuserでもguestでもない
      return { $nin: authors };
    }

    // AND演算子をチェック（例: "!admin&user" - これは論理的に不可能だが、NOTのみ適用）
    if (cleanExpression.includes('&')) {
      const authors = cleanExpression.split('&').map(a => a.trim()).filter(a => a);
      // 最初の作者のNOTのみ適用（複数作者のANDは不可能なため）
      return { $ne: authors[0] };
    }

    // 単純なNOT演算（例: "!admin"）
    return { $ne: cleanExpression };
  }
}

// デフォルトインスタンス
export const postRepository = new PostRepository();
