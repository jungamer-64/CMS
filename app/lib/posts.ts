import { Collection } from 'mongodb';
import { getDatabase } from './mongodb';
import { Post, PostInput } from './types';

export async function getPostsCollection(): Promise<Collection<Post>> {
  const db = await getDatabase();
  return db.collection<Post>('posts');
}

export async function createPost(postData: PostInput): Promise<Post> {
  const collection = await getPostsCollection();
  const post: Post = {
    ...postData,
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
  const query: any = { isDeleted: { $ne: true } };
  
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
