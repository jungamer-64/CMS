import { Collection, ObjectId, Db } from 'mongodb';
import { getDatabase } from '../connection';

// ============================================================================
// Post Database Model（統一パターン）
// ============================================================================

export type PostStatus = 'draft' | 'published' | 'archived';

export interface PostDocument {
  _id?: ObjectId;
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  status: PostStatus;
  authorId: string;
  authorName: string;
  tags: string[];
  categories: string[];
  featuredImage?: string;
  publishedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export class PostModel {
  private readonly collection: Collection<PostDocument>;

  constructor(db: Db) {
    this.collection = db.collection<PostDocument>('posts');
  }

  // インデックス作成
  async ensureIndexes(): Promise<void> {
    try {
      // ユニークインデックス
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ slug: 1 }, { unique: true });
      
      // 検索用インデックス
      await this.collection.createIndex({ title: 'text', content: 'text', excerpt: 'text' });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ authorId: 1 });
      await this.collection.createIndex({ tags: 1 });
      await this.collection.createIndex({ categories: 1 });
      await this.collection.createIndex({ publishedAt: -1 });
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ isDeleted: 1 });
    } catch (err: unknown) {
      console.warn('ポストインデックス作成警告:', err instanceof Error ? err : String(err));
    }
  }

  // 投稿作成
  async create(postData: Omit<PostDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<PostDocument> {
    const now = new Date();
    const postDoc: PostDocument = {
      ...postData,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(postDoc);
    return { ...postDoc, _id: result.insertedId };
  }

  // ID（文字列）で投稿取得
  async findById(id: string): Promise<PostDocument | null> {
    return await this.collection.findOne({ id, isDeleted: false });
  }

  // スラッグで投稿取得
  async findBySlug(slug: string): Promise<PostDocument | null> {
    return await this.collection.findOne({ slug, isDeleted: false });
  }

  // 全投稿取得（フィルタリング・ページネーション対応）
  async findAll(options: {
    status?: PostStatus;
    authorId?: string;
    search?: string;
    tags?: string[];
    categories?: string[];
    includeDeleted?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    posts: PostDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      authorId,
      search,
      tags,
      categories,
      includeDeleted = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = options;

    // フィルター構築
    const filter: Record<string, unknown> = {};
    
    if (!includeDeleted) {
      filter.isDeleted = false;
    }
    
    if (status) filter.status = status;
    if (authorId) filter.authorId = authorId;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }
    
    if (categories && categories.length > 0) {
      filter.categories = { $in: categories };
    }

    // ソート設定
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // ページネーション
    const skip = (page - 1) * limit;

    // 総数取得
    const total = await this.collection.countDocuments(filter);

    // 投稿取得
    const posts = await this.collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 投稿更新
  async update(id: string, updateData: Partial<Omit<PostDocument, '_id' | 'id' | 'createdAt'>>): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id, isDeleted: false },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  // 投稿削除（論理削除）
  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id },
      { 
        $set: { 
          isDeleted: true, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  // 投稿復元
  async restoreById(id: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id },
      { 
        $set: { 
          isDeleted: false, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  // 投稿の完全削除（物理削除）
  async permanentDeleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // 投稿数カウント
  async count(filter: { 
    status?: PostStatus;
    authorId?: string;
    includeDeleted?: boolean;
  } = {}): Promise<number> {
    const queryFilter: Record<string, unknown> = {};
    
    if (!filter.includeDeleted) {
      queryFilter.isDeleted = false;
    }
    
    if (filter.status) queryFilter.status = filter.status;
    if (filter.authorId) queryFilter.authorId = filter.authorId;
    
    return await this.collection.countDocuments(queryFilter);
  }

  // 公開済み投稿のみ取得
  async findPublished(options: {
    search?: string;
    tags?: string[];
    categories?: string[];
    page?: number;
    limit?: number;
  } = {}): Promise<{
    posts: PostDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll({
      ...options,
      status: 'published',
      includeDeleted: false
    });
  }
}

// ファクトリー関数
export const createPostModel = async (): Promise<PostModel> => {
  const db = getDatabase();
  return new PostModel(db);
};

export default PostModel;
