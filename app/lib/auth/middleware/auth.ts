/**
 * API認証ミドルウェア
 * LIB_COMMONIZATION_PLAN.md フェーズ3対応
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import type { User } from '../../core/types';
import { createErrorResponse } from '../../api/client/utils';

/**
 * 認証コンテキスト
 */
export interface AuthContext {
  user: User | null;
  token?: string;
}

/**
 * 認証付きAPI handler型
 */
export type AuthenticatedApiHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>;

/**
 * JWT ペイロード型定義
 */
interface JwtPayload {
  userId: string;
  username?: string;
  email?: string;
  displayName?: string;
  role?: 'user' | 'admin';
  iat: number;
  exp?: number;
}

/**
 * JWT トークンを検証して user オブジェクトを取得
 */
async function verifyToken(token: string): Promise<User | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // JWT ペイロードから User オブジェクトを構築
    if (decoded?.userId) {
      return {
        id: decoded.userId,
        username: decoded.username || '',
        email: decoded.email || '',
        passwordHash: '', // セキュリティ上、パスワードハッシュは含めない
        displayName: decoded.displayName || decoded.username || '',
        role: decoded.role || 'user',
        createdAt: new Date(decoded.iat * 1000), // JWT の iat から作成日時を推定
      };
    }
    
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * API認証ミドルウェア
 * 
 * @param handler - 認証後に実行するハンドラー
 * @returns 認証処理付きのAPI handler
 */
export function withApiAuth(handler: AuthenticatedApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Authorization ヘッダーからトークンを取得
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : null;

      if (!token) {
        return createErrorResponse('認証トークンが必要です', 401);
      }

      // トークンを検証
      const user = await verifyToken(token);
      if (!user) {
        return createErrorResponse('無効な認証トークンです', 401);
      }

      // 認証コンテキストを作成
      const context: AuthContext = {
        user,
        token,
      };

      // 認証済みハンドラーを実行
      return await handler(request, context);
      
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return createErrorResponse('認証処理中にエラーが発生しました', 500);
    }
  };
}

/**
 * 管理者権限チェック付きAPI認証ミドルウェア
 */
export function withAdminAuth(handler: AuthenticatedApiHandler) {
  return withApiAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
    if (!context.user || context.user.role !== 'admin') {
      return createErrorResponse('管理者権限が必要です', 403);
    }
    
    return await handler(request, context);
  });
}

/**
 * オプショナル認証ミドルウェア（認証なしでもアクセス可能）
 */
export function withOptionalAuth(handler: AuthenticatedApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : null;

      let user: User | null = null;
      if (token) {
        user = await verifyToken(token);
      }

      const context: AuthContext = {
        user,
        token: token || undefined,
      };

      return await handler(request, context);
      
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      return createErrorResponse('認証処理中にエラーが発生しました', 500);
    }
  };
}
