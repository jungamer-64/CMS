import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserById } from './users';
import { validateApiKey as validateApiKeyAuth, validateUserSession } from './api-auth';
import { ApiKeyPermissions } from './types';
import { JWT_SECRET } from './env';

export interface AuthContext {
  isAuthenticated: boolean;
  authMethod: 'session' | 'apikey';
  user?: {
    id: string;
    username: string;
    role: string;
  };
  apiKey?: {
    userId: string;
    permissions: ApiKeyPermissions;
  };
}

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    const user = await getUserById(decoded.userId);

    return user;
  } catch (error) {
    console.error('認証エラー:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('認証が必要です');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('管理者権限が必要です');
  }
  return user;
}

/**
 * 統合認証ミドルウェア
 * セッション認証とAPIキー認証の両方をサポート
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredPermission?: {
    resource: keyof ApiKeyPermissions;
    action: string;
  }
): Promise<{ success: boolean; context?: AuthContext; error?: string }> {
  
  // 1. セッション認証を試行
  const sessionValidation = await validateUserSession(request);
  
  if (sessionValidation.valid) {
    // セッション認証成功
    if (!sessionValidation.user) {
      return { success: false, error: 'ユーザー情報が不正です' };
    }

    const context: AuthContext = {
      isAuthenticated: true,
      authMethod: 'session',
      user: {
        id: sessionValidation.user.id,
        username: sessionValidation.user.username,
        role: sessionValidation.user.role
      }
    };

    // 管理者は全ての権限を持つと仮定
    if (context.user?.role === 'admin') {
      return { success: true, context };
    }

    // 権限チェック（必要に応じて）
    if (requiredPermission && context.user) {
      // セッションユーザーの場合、基本的な権限チェック
      const hasPermission = checkSessionUserPermission(context.user.role, requiredPermission);
      if (!hasPermission) {
        return { 
          success: false, 
          error: `権限が不足しています。必要な権限: ${requiredPermission.resource}:${requiredPermission.action}` 
        };
      }
    }

    return { success: true, context };
  }

  // 2. APIキー認証を試行
  const apiKeyValidation = await validateApiKeyAuth(request, requiredPermission);
  
  if (apiKeyValidation.valid) {
    // APIキー認証成功
    const context: AuthContext = {
      isAuthenticated: true,
      authMethod: 'apikey',
      apiKey: {
        userId: apiKeyValidation.userId!,
        permissions: apiKeyValidation.permissions!
      }
    };

    return { success: true, context };
  }

  // 3. 両方とも失敗
  return {
    success: false,
    error: 'セッション認証またはAPIキー認証が必要です'
  };
}

/**
 * セッションユーザーの基本的な権限チェック
 */
function checkSessionUserPermission(
  userRole: string,
  permission: { resource: keyof ApiKeyPermissions; action: string }
): boolean {
  // 管理者は全ての権限を持つ
  if (userRole === 'admin') {
    return true;
  }

  // 一般ユーザーの基本権限
  if (userRole === 'user') {
    switch (permission.resource) {
      case 'posts':
        return ['create', 'read'].includes(permission.action);
      case 'comments':
        return permission.action === 'read';
      case 'uploads':
        return ['create', 'read'].includes(permission.action);
      default:
        return false;
    }
  }

  return false;
}

/**
 * APIエンドポイント用の認証ラッパー
 */
export function withApiAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  requiredPermission?: {
    resource: keyof ApiKeyPermissions;
    action: string;
  }
) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request, requiredPermission);
    
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.error 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, authResult.context!);
  };
}
