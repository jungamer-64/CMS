import { getDatabase } from '@/app/lib/data/connections/mongodb';
import { ObjectId } from 'mongodb';

// スタブファイル - 削除されたモジュールの代替
export * from '../core/types/api-unified';
export const createUser = async () => { throw new Error('Not implemented'); };
export const getAllUsers = async () => { throw new Error('Not implemented'); };
export const getUserByUsername = async () => { throw new Error('Not implemented'); };
export const updateUser = async () => { throw new Error('Not implemented'); };
export const getUserSessionInfo = async () => { throw new Error('Not implemented'); };
export const changePassword = async () => { throw new Error('Not implemented'); };
export const updateUserDarkMode = async (userId: string, darkMode: boolean): Promise<boolean> => {
  const db = await getDatabase();
  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { darkMode } }
  );
  return result.modifiedCount > 0;
};
export const getUserDarkMode = async (userId: string): Promise<boolean | null> => {
  const db = await getDatabase();
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { darkMode: 1 } }
  );
  return user?.darkMode ?? null;
};
export const getUsersCollection = async () => { throw new Error('Not implemented'); };
