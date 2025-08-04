import { getDatabase } from '@/app/lib/data/connections/mongodb';

// スタブファイル - 削除されたモジュールの代替
export * from '../core/types/api-unified';
export const createComment = async (commentData: { postId: string; author: string; email: string; content: string }) => {
  const db = await getDatabase();
  const newComment = {
    ...commentData,
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false
  };
  const result = await db.collection('comments').insertOne(newComment);
  return result.insertedId ? newComment : null;
};
export const getCommentById = async (commentId: string) => {
  const db = await getDatabase();
  const comment = await db.collection('comments').findOne({ id: commentId, isDeleted: { $ne: true } });
  return comment;
};
export const updateComment = async (commentId: string, updateData: Partial<{ isApproved: boolean }>) => {
  const db = await getDatabase();
  const result = await db.collection('comments').updateOne(
    { id: commentId },
    { $set: { ...updateData, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};
export const deleteComment = async (commentId: string) => {
  const db = await getDatabase();
  const result = await db.collection('comments').updateOne(
    { id: commentId },
    { $set: { isDeleted: true, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};
export const approveComment = async (commentId: string) => {
  const db = await getDatabase();
  const result = await db.collection('comments').updateOne(
    { id: commentId },
    { $set: { isApproved: true, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};
export const getCommentsByPostSlug = async (postSlug: string) => {
  const db = await getDatabase();
  const comments = await db.collection('comments').find({ postSlug, isDeleted: { $ne: true } }).toArray();
  return comments;
};
export const getAllCommentsForAdmin = async () => { throw new Error('Not implemented'); };
