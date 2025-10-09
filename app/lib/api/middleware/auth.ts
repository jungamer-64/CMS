/**
 * 認証ミドルウェア
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 *
 * 既存のauth-middleware.tsを統合
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError, AuthorizationError } from '../../core/errors';

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requiredRole?: 'user' | 'admin';
  skipPaths?: string[];
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    role: 'user' | 'admin';
  };
}

// 認証チェック
export function createAuthMiddleware(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { requireAuth = true, requiredRole, skipPaths = [] } = options;

    // スキップパスのチェック
    const pathname = req.nextUrl.pathname;
    if (skipPaths.some(path => pathname.startsWith(path))) {
      return handler(req as AuthenticatedRequest);
    }

    try {
      // トークンの取得
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (requireAuth && !token) {
        throw new AuthenticationError('認証トークンが必要です');
      }

      if (token) {
        // トークンの検証
        const user = await verifyToken(token);

        if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
          throw new AuthorizationError(`${requiredRole}権限が必要です`);
        }

        // ユーザー情報をリクエストに追加
        (req as AuthenticatedRequest).user = user;
      }

      const result = await handler(req as AuthenticatedRequest);
      return result;

    } catch (err: unknown) {
      if (err instanceof AuthenticationError || err instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err instanceof AuthenticationError ? 401 : 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// トークン検証
async function verifyToken(token: string): Promise<{
  id: string;
  username: string;
  role: 'user' | 'admin';
}> {
  try {
    // 直接JWTトークンを検証
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, secret) as {
      id?: string;
      userId?: string;
      username: string;
      role?: string;
    };

    return {
      id: decoded.id || decoded.userId || '',
      username: decoded.username,
      role: (decoded.role as 'user' | 'admin') || 'user'
    };
  } catch (err: unknown) {
    console.error('Token verification failed:', err instanceof Error ? err : String(err));
    throw new AuthenticationError('Invalid token');
  }
}
