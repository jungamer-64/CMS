/**
 * セッション管理ユーティリティ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import { cookies } from 'next/headers';
import { generateToken, verifyToken, type TokenPayload } from './jwt-utils';

export interface SessionData {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  createdAt: Date;
  expiresAt: Date;
}

/**
 * セッションを作成
 */
export async function createSession(payload: TokenPayload): Promise<string> {
  const token = generateToken(payload);
  
  // クッキーにトークンを設定
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24時間
  });
  
  return token;
}

/**
 * セッションを検証
 */
export async function verifySession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * セッションを破棄
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
