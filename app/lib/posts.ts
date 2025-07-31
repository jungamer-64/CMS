import { Collection } from 'mongodb';
import { getDatabase } from './mongodb';
import { Post, PostInput } from './types';

export async function getPostsCollection(): Promise<Collection<Post>> {
  const db = await getDatabase();
  return db.collection<Post>('posts');
}

export async function createPost(postData: PostInput): Promise<Post> {
  const collection = await getPostsCollection();
  
  // 一意なIDとスラッグを生成
  const id = crypto.randomUUID();
  const slug = postData.slug || generateSlugFromTitle(postData.title);
  
  const post: Post = {
    id,
    ...postData,
    slug,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await collection.insertOne(post);
  return { ...post, _id: result.insertedId.toString() };
}

export async function getAllPosts(options?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ posts: Post[]; total: number }> {
  const collection = await getPostsCollection();
  
  const {
    page = 1,
    limit = 10,
    search = ''
  } = options || {};

  // 検索クエリを構築
  const query: Record<string, unknown> = { isDeleted: { $ne: true } };
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
  }

  // 総数を取得
  const total = await collection.countDocuments(query);

  // ページネーション付きで投稿を取得
  const posts = await collection
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { posts, total };
}

export async function getAllPostsSimple(): Promise<Post[]> {
  const collection = await getPostsCollection();
  return await collection.find({ isDeleted: { $ne: true } }).toArray();
}

export async function getAllPostsForAdmin(): Promise<Post[]> {
  const collection = await getPostsCollection();
  return await collection.find({}).toArray();
}

export async function getPostById(id: string): Promise<Post | null> {
  const collection = await getPostsCollection();
  const post = await collection.findOne({ id });
  
  if (!post) {
    return null;
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    author: post.author,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isDeleted: post.isDeleted
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  // URLエンコードされたslugをデコード
  const decodedSlug = decodeURIComponent(slug);
  const collection = await getPostsCollection();
  const post = await collection.findOne({ slug: decodedSlug });
  
  // 削除された投稿は返さない
  if (post && post.isDeleted) {
    return null;
  }
  
  return post;
}

export async function updatePost(id: string, updateData: Partial<Post>): Promise<Post | null> {
  const collection = await getPostsCollection();
  const result = await collection.findOneAndUpdate(
    { id },
    { 
      $set: { 
        ...updateData, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  return result;
}

export async function updatePostBySlug(slug: string, updateData: Partial<Post>): Promise<Post | null> {
  const decodedSlug = decodeURIComponent(slug);
  const collection = await getPostsCollection();
  const result = await collection.findOneAndUpdate(
    { slug: decodedSlug },
    { 
      $set: { 
        ...updateData, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  return result;
}

export async function deletePost(id: string): Promise<boolean> {
  const collection = await getPostsCollection();
  const result = await collection.updateOne(
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

export async function deletePostBySlug(slug: string): Promise<boolean> {
  const decodedSlug = decodeURIComponent(slug);
  const collection = await getPostsCollection();
  const result = await collection.updateOne(
    { slug: decodedSlug },
    { 
      $set: { 
        isDeleted: true,
        updatedAt: new Date()
      }
    }
  );
  return result.modifiedCount > 0;
}

export async function restorePost(id: string): Promise<boolean> {
  const collection = await getPostsCollection();
  const result = await collection.updateOne(
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

export async function permanentlyDeletePost(id: string): Promise<boolean> {
  const collection = await getPostsCollection();
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

// バリデーション関数
export function validatePostData(postData: PostInput): string[] {
  const errors: string[] = [];
  
  if (!postData.title || postData.title.trim().length === 0) {
    errors.push('タイトルは必須です');
  }
  
  if (!postData.content || postData.content.trim().length === 0) {
    errors.push('内容は必須です');
  }
  
  if (!postData.author || postData.author.trim().length === 0) {
    errors.push('作者は必須です');
  }
  
  if (postData.title && postData.title.length > 200) {
    errors.push('タイトルは200文字以内にしてください');
  }
  
  return errors;
}

// ヘルパー関数
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '-') // 日本語対応
    .replace(/-+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}
