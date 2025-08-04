/**
 * JWT認証ユーティリティ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/environment';

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
}

/**
 * JWTトークンを生成
 */
export function generateToken(payload: TokenPayload): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '1d'
  } as jwt.SignOptions);
}

/**
 * JWTトークンを検証
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!env.JWT_SECRET) {
      return null;
    }
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    // トークンが無効な場合は null を返す
    return null;
  }
}

/**
 * JWTトークンをリフレッシュ
 */
export function refreshToken(oldToken: string): string | null {
  const payload = verifyToken(oldToken);
  if (!payload) return null;
  
  return generateToken({
    userId: payload.userId,
    username: payload.username,
    role: payload.role
  });
}
