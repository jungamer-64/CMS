import { Collection } from 'mongodb';
import { getDatabase } from './mongodb';
import { Comment, CommentInput } from './types';

export async function getCommentsCollection(): Promise<Collection<Comment>> {
  const db = await getDatabase();
  return db.collection<Comment>('comments');
}

export async function createComment(commentData: CommentInput, autoApprove = false): Promise<Comment> {
  const collection = await getCommentsCollection();
  const comment: Comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    ...commentData,
    isApproved: autoApprove, // 設定に基づいて自動承認
    createdAt: new Date(),
    isDeleted: false
  };
  
  const result = await collection.insertOne(comment);
  return { ...comment, _id: result.insertedId.toString() };
}

export async function getCommentsByPostSlug(postSlug: string, includeUnapproved = false): Promise<Comment[]> {
  const collection = await getCommentsCollection();
  const filter: Record<string, unknown> = { 
    postSlug, 
    isDeleted: { $ne: true } 
  };
  
  if (!includeUnapproved) {
    filter.isApproved = true;
  }
  
  return await collection.find(filter).sort({ createdAt: 1 }).toArray();
}

export async function getAllCommentsForAdmin(): Promise<Comment[]> {
  const collection = await getCommentsCollection();
  return await collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function approveComment(commentId: string): Promise<boolean> {
  const collection = await getCommentsCollection();
  const result = await collection.updateOne(
    { id: commentId },
    { 
      $set: { 
        isApproved: true,
        updatedAt: new Date()
      }
    }
  );
  return result.modifiedCount > 0;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const collection = await getCommentsCollection();
  const result = await collection.updateOne(
    { id: commentId },
    { 
      $set: { 
        isDeleted: true,
        updatedAt: new Date()
      }
    }
  );
  return result.modifiedCount > 0;
}

export async function getCommentById(commentId: string): Promise<Comment | null> {
  const collection = await getCommentsCollection();
  return await collection.findOne({ id: commentId, isDeleted: { $ne: true } });
}

export async function updateComment(commentId: string, updates: Partial<Comment>): Promise<boolean> {
  const collection = await getCommentsCollection();
  const result = await collection.updateOne(
    { id: commentId },
    { 
      $set: { 
        ...updates,
        updatedAt: new Date()
      }
    }
  );
  return result.modifiedCount > 0;
}
