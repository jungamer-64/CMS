import { NextRequest } from 'next/server';
import { ApiKeyManager } from './api-keys-manager';
import { ApiKeyPermissions } from './types';
import { AuthenticatedUser } from './api-utils';
import { JWT_SECRET } from './env';

// APIキー認証と権限チェック
export async function validateApiKey(
  request: NextRequest, 
  requiredPermission?: { 
    resource: keyof ApiKeyPermissions, 
    action: string
  }
): Promise<{ valid: boolean; error?: string; userId?: string; permissions?: ApiKeyPermissions }> {
  
  // リクエストからAPIキーを取得
  const providedKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!providedKey) {
    return { valid: false, error: 'API key is required. Use X-API-Key header or Authorization: Bearer <key>' };
  }

  try {
    // 新しいAPIキーシステムで認証
    const validation = await ApiKeyManager.validateApiKey(providedKey);
    
    if (!validation) {
      return { valid: false, error: 'Invalid API key' };
    }

    // 権限チェック
    if (requiredPermission) {
      const hasPermission = ApiKeyManager.hasPermission(
        validation.permissions,
        requiredPermission.resource,
        requiredPermission.action
      );
      
      if (!hasPermission) {
        return { 
          valid: false, 
          error: `Insufficient permissions. Required: ${requiredPermission.resource}:${requiredPermission.action}` 
        };
      }
    }
    
    return { 
      valid: true, 
      userId: validation.userId,
      permissions: validation.permissions
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false, error: 'API key validation failed' };
  }
}
// レート制限（簡易版）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): { allowed: boolean; error?: string } {
  const now = Date.now();
  const key = ip;
  
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    // 新しいウィンドウまたは期限切れ
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (current.count >= limit) {
    return { allowed: false, error: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds` };
  }
  
  current.count++;
  return { allowed: true };
}

// ユーザーセッションベースの認証
export async function validateUserSession(request: NextRequest): Promise<{ valid: boolean; user?: AuthenticatedUser; error?: string }> {
  try {
    console.log('validateUserSession: Starting validation...');
    console.log('validateUserSession: All cookies:', request.cookies.getAll());
    
    // Cookieからトークンを取得（roleが含まれているtokenを優先）
    const tokenCookie = request.cookies.get('token')?.value;
    const authTokenCookie = request.cookies.get('auth_token')?.value;
    
    console.log('validateUserSession: token cookie:', tokenCookie ? 'Found' : 'Not found');
    console.log('validateUserSession: auth_token cookie:', authTokenCookie ? 'Found' : 'Not found');
    
    const authToken = tokenCookie || authTokenCookie;
    console.log('validateUserSession: Using token:', tokenCookie ? 'token' : 'auth_token');
    
    if (!authToken) {
      console.log('validateUserSession: No auth token found');
      return { valid: false, error: 'セッションが見つかりません' };
    }

    // JWTトークンを検証（既存の認証システムを使用）
    const { default: jwt } = await import('jsonwebtoken');
    
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET);
      console.log('validateUserSession: Token verified, user:', decoded);
      
      // typeofチェックでオブジェクトであることを確認
      if (typeof decoded === 'object' && decoded !== null) {
        const user = decoded as { userId?: string; username?: string; role?: string; email?: string; displayName?: string };
        
        // 必須フィールドの存在チェック
        if (!user.userId || !user.username || !user.role) {
          console.log('validateUserSession: Missing required fields in token');
          return { valid: false, error: 'トークンに必要な情報が不足しています' };
        }
        
        return { 
          valid: true, 
          user: {
            id: user.userId,
            username: user.username,
            email: user.email || '',
            displayName: user.displayName || user.username,
            role: user.role as 'user' | 'admin'
          }
        };
      } else {
        console.log('validateUserSession: Invalid token format');
        return { valid: false, error: 'トークンの形式が無効です' };
      }
    } catch (jwtError) {
      console.log('validateUserSession: JWT verification failed:', jwtError);
      return { valid: false, error: 'トークンが無効です' };
    }
  } catch (error) {
    console.log('validateUserSession: Error:', error);
    return { valid: false, error: '認証エラーが発生しました' };
  }
}
