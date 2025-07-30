import { Collection } from 'mongodb';
import { getDatabase } from './mongodb';
import { User, UserInput, PasswordResetToken } from './types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

export async function getPasswordResetTokensCollection(): Promise<Collection<PasswordResetToken>> {
  const db = await getDatabase();
  return db.collection<PasswordResetToken>('password_reset_tokens');
}

export async function createUser(userData: UserInput): Promise<User> {
  const collection = await getUsersCollection();
  
  // ユーザー名とメールの重複チェック
  const existingUser = await collection.findOne({
    $or: [
      { username: userData.username },
      { email: userData.email }
    ]
  });
  
  if (existingUser) {
    throw new Error('ユーザー名またはメールアドレスが既に使用されています');
  }
  
  // パスワードのハッシュ化
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);
  
  const user: User = {
    id: Date.now().toString(),
    username: userData.username,
    email: userData.email,
    passwordHash,
    displayName: userData.displayName,
    role: 'user', // デフォルトは一般ユーザー
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await collection.insertOne(user);
  return { ...user, _id: result.insertedId.toString() };
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ username });
  
  if (!user) {
    return null;
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }
  
  return user;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return await collection.findOne({ username });
}

export async function getUserById(id: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return await collection.findOne({ id });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return await collection.findOne({ email });
}

export async function createPasswordResetToken(email: string): Promise<PasswordResetToken | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const collection = await getPasswordResetTokensCollection();
  
  // 既存の未使用トークンを無効化
  await collection.updateMany(
    { email, used: false },
    { $set: { used: true } }
  );

  // 新しいトークンを生成
  const token = crypto.randomBytes(32).toString('hex');
  const resetToken: PasswordResetToken = {
    id: Date.now().toString(),
    userId: user.id,
    token,
    email,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1時間有効
    createdAt: new Date(),
    used: false,
  };

  const result = await collection.insertOne(resetToken);
  return { ...resetToken, _id: result.insertedId.toString() };
}

export async function validatePasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const collection = await getPasswordResetTokensCollection();
  const resetToken = await collection.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  return resetToken;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const resetToken = await validatePasswordResetToken(token);
  if (!resetToken) {
    return false;
  }

  const usersCollection = await getUsersCollection();
  const tokensCollection = await getPasswordResetTokensCollection();

  // パスワードのハッシュ化
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // パスワードを更新
  const updateResult = await usersCollection.updateOne(
    { id: resetToken.userId },
    { 
      $set: { 
        passwordHash,
        updatedAt: new Date()
      }
    }
  );

  if (updateResult.modifiedCount === 0) {
    return false;
  }

  // トークンを使用済みにマーク
  await tokensCollection.updateOne(
    { token },
    { $set: { used: true } }
  );

  return true;
}

export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<boolean> {
  const collection = await getUsersCollection();
  const result = await collection.updateOne(
    { id: userId },
    { 
      $set: { 
        role,
        updatedAt: new Date()
      }
    }
  );

  return result.modifiedCount > 0;
}

export async function getAllUsers(): Promise<User[]> {
  const collection = await getUsersCollection();
  return await collection.find({}).toArray();
}

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.role === 'admin';
}
