import { Collection, ObjectId, Db } from 'mongodb';
import { getDatabase } from '../connection';

// ============================================================================
// Comment Database Model（統一パターン）
// ============================================================================

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface CommentDocument {
  _id?: ObjectId;
  id: string;
  postId: string;
  parentId?: string; // 返信コメントの場合
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  authorIp?: string;
  content: string;
  status: CommentStatus;
  isDeleted: boolean;
  userId?: string; // ログインユーザーの場合
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentModel {
  private readonly collection: Collection<CommentDocument>;

  constructor(db: Db) {
    this.collection = db.collection<CommentDocument>('comments');
  }

  // インデックス作成
  async ensureIndexes(): Promise<void> {
    try {
      // ユニークインデックス
      await this.collection.createIndex({ id: 1 }, { unique: true });
      
      // 検索用インデックス
      await this.collection.createIndex({ postId: 1 });
      await this.collection.createIndex({ parentId: 1 });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ authorEmail: 1 });
      await this.collection.createIndex({ userId: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ isDeleted: 1 });
      
      // 複合インデックス
      await this.collection.createIndex({ postId: 1, status: 1, isDeleted: 1 });
    } catch (err: unknown) {
      console.warn('コメントインデックス作成警告:', err instanceof Error ? err : String(err));
    }
  }

  // コメント作成
  async create(commentData: Omit<CommentDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<CommentDocument> {
    const now = new Date();
    const commentDoc: CommentDocument = {
      ...commentData,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(commentDoc);
    return { ...commentDoc, _id: result.insertedId };
  }

  // ID（文字列）でコメント取得
  async findById(id: string): Promise<CommentDocument | null> {
    return await this.collection.findOne({ id, isDeleted: false });
  }

  // 投稿IDでコメント一覧取得
  async findByPostId(postId: string, options: {
    status?: CommentStatus[];
    includeDeleted?: boolean;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    comments: CommentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status = ['approved'],
      includeDeleted = false,
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = options;

    // フィルター構築
    const filter: Record<string, unknown> = { postId };
    
    if (!includeDeleted) {
      filter.isDeleted = false;
    }
    
    if (status.length > 0) {
      filter.status = { $in: status };
    }

    // ソート設定
    const sort: Record<string, 1 | -1> = {
      createdAt: sortOrder === 'asc' ? 1 : -1
    };

    // ページネーション
    const skip = (page - 1) * limit;

    // 総数取得
    const total = await this.collection.countDocuments(filter);

    // コメント取得
    const comments = await this.collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 全コメント取得（管理者用）
  async findAll(options: {
    status?: CommentStatus[];
    postId?: string;
    authorEmail?: string;
    search?: string;
    includeDeleted?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    comments: CommentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      postId,
      authorEmail,
      search,
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
    
    if (status && status.length > 0) {
      filter.status = { $in: status };
    }
    
    if (postId) filter.postId = postId;
    if (authorEmail) filter.authorEmail = authorEmail;
    
    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
        { authorEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // ソート設定
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // ページネーション
    const skip = (page - 1) * limit;

    // 総数取得
    const total = await this.collection.countDocuments(filter);

    // コメント取得
    const comments = await this.collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // コメント更新
  async update(id: string, updateData: Partial<Omit<CommentDocument, '_id' | 'id' | 'createdAt'>>): Promise<boolean> {
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

  // コメント削除（論理削除）
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

  // コメント復元
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

  // コメントの完全削除（物理削除）
  async permanentDeleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // コメント承認
  async approveById(id: string): Promise<boolean> {
    return this.update(id, { status: 'approved' });
  }

  // コメント拒否
  async rejectById(id: string): Promise<boolean> {
    return this.update(id, { status: 'rejected' });
  }

  // スパムマーク
  async markAsSpamById(id: string): Promise<boolean> {
    return this.update(id, { status: 'spam' });
  }

  // 投稿IDでコメント数カウント
  async countByPostId(postId: string, options: {
    status?: CommentStatus[];
    includeDeleted?: boolean;
  } = {}): Promise<number> {
    const {
      status = ['approved'],
      includeDeleted = false
    } = options;

    const filter: Record<string, unknown> = { postId };
    
    if (!includeDeleted) {
      filter.isDeleted = false;
    }
    
    if (status.length > 0) {
      filter.status = { $in: status };
    }

    return await this.collection.countDocuments(filter);
  }

  // ステータス別コメント数カウント
  async countByStatus(): Promise<Record<CommentStatus, number>> {
    const pipeline = [
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    
    const counts: Record<CommentStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      spam: 0
    };

    result.forEach(item => {
      if (item._id in counts) {
        counts[item._id as CommentStatus] = item.count;
      }
    });

    return counts;
  }
}

// ファクトリー関数
export const createCommentModel = async (): Promise<CommentModel> => {
  const db = getDatabase();
  return new CommentModel(db);
};

export default CommentModel;
