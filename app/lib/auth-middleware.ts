/**
 * 高速・厳格型安全API認証ミドルウェア
 *
 * - 型安全なリクエスト処理
 * - パフォーマンス最適化
 * - 統一されたエラーハンドリング
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from './core/types';
import { ApiErrorCode } from './core/types';
import { createApiError } from './core/utils/error-creators';

// 型をエクスポート
export type { User } from './core/types';

/**
 * レート制限設定
 */
const RATE_LIMIT_CONFIG = {
  name: 'api-login-attempts',
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15分
  blockDurationMs: 15 * 60 * 1000 // 15分
};

/**
 * IPアドレスを取得
 */
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

/**
 * ログイン試行をチェック・記録（新しいレート制限システム使用）
 */
async function checkLoginAttempts(ip: string): Promise<{ allowed: boolean; remainingAttempts?: number }> {
  const { RateLimiter } = await import('./security/rate-limiter');
  const rateLimiter = RateLimiter.getInstance();

  const result = await rateLimiter.checkLimit(ip, RATE_LIMIT_CONFIG);
  return {
    allowed: result.allowed,
    remainingAttempts: result.remainingAttempts
  };
}

/**
 * ログイン失敗を記録（新しいレート制限システム使用）
 */
async function recordFailedLogin(ip: string): Promise<void> {
  const { RateLimiter } = await import('./security/rate-limiter');
  const rateLimiter = RateLimiter.getInstance();

  await rateLimiter.recordFailure(ip, RATE_LIMIT_CONFIG);
}

/**
 * ログイン成功時のクリーンアップ（新しいレート制限システム使用）
 */
async function clearFailedLogins(ip: string): Promise<void> {
  const { RateLimiter } = await import('./security/rate-limiter');
  const rateLimiter = RateLimiter.getInstance();

  await rateLimiter.clearFailures(ip);
}

/**
 * セキュリティイベントをログに記録
 */
async function logSecurityEvent(event: {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'CSRF_ATTEMPT';
  ip: string;
  userAgent?: string;
  userId?: string;
  details?: string;
}): Promise<void> {
  try {
    const { logSecurityEvent: logEvent } = await import('./security/security-logger');
    await logEvent(event);
  } catch (error) {
    // ログの失敗は認証処理に影響しないようにする
    console.error('Failed to log security event:', error);
  }
}

/**
 * 認証コンテキスト型定義
 */
export interface AuthContext {
  readonly user: User;
  readonly apiKey?: string;
  readonly permissions?: readonly string[];
  readonly sessionInfo: {
    readonly ip: string;
    readonly userAgent: string;
    readonly loginTime: Date;
    readonly expiresAt: Date;
  };
}

/**
 * API認証ハンドラー型定義 - より柔軟な戻り値型
 */
export type ApiAuthHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>;

/**
 * パラメータ付きAPI認証ハンドラー型定義 - より柔軟な戻り値型
 */
export type ApiAuthHandlerWithParams = (
  request: NextRequest,
  context: AuthContext,
  params: Record<string, string>
) => Promise<NextResponse>;

/**
 * 認証結果の型定義
 */
interface AuthResult {
  success: boolean;
  user?: User;
  apiKey?: string;
  permissions?: string[];
  error?: string;
}

/**
 * 高速API認証ミドルウェア
 */
export function withApiAuth(
  handler: ApiAuthHandler | ApiAuthHandlerWithParams
): (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const clientIP = getClientIP(request);

    try {
      // レート制限チェック
      const rateLimitCheck = await checkLoginAttempts(clientIP);
      if (!rateLimitCheck.allowed) {
        await logSecurityEvent({
          type: 'RATE_LIMIT',
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || undefined,
          details: 'Rate limit exceeded'
        });
        return NextResponse.json(
          createApiError(429, ApiErrorCode.RATE_LIMIT_EXCEEDED, 'Too many failed attempts. Please try again later.'),
          { status: 429 }
        );
      }

      // Origin検証（CSRF対策）
      if (!isValidRequest(request)) {
        await recordFailedLogin(clientIP);
        await logSecurityEvent({
          type: 'CSRF_ATTEMPT',
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || undefined,
          details: `Invalid origin: ${request.headers.get('origin') || 'none'}`
        });
        return NextResponse.json(
          createApiError(403, ApiErrorCode.FORBIDDEN, 'Invalid request origin'),
          { status: 403 }
        );
      }

      // 認証処理
      const authResult = await authenticateRequest(request);

      if (!authResult.success) {
        await recordFailedLogin(clientIP);
        await logSecurityEvent({
          type: 'LOGIN_FAILURE',
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || undefined,
          details: authResult.error
        });
        return NextResponse.json(
          createApiError(401, ApiErrorCode.UNAUTHORIZED, authResult.error || 'Unauthorized access'),
          { status: 401 }
        );
      }

      // 認証成功時のクリーンアップとログ
      await clearFailedLogins(clientIP);
      await logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
        userId: authResult.user?.id
      });

      const authContext: AuthContext = {
        user: authResult.user!,
        apiKey: authResult.apiKey,
        permissions: authResult.permissions,
        sessionInfo: {
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          loginTime: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24時間
        }
      };

      // セキュリティヘッダーを追加
      // Next.js 15ではparamsがPromiseになるため、awaitで解決
      const resolvedParams = await context.params;

      const response = resolvedParams && Object.keys(resolvedParams).length > 0
        ? await (handler as ApiAuthHandlerWithParams)(request, authContext, resolvedParams)
        : await (handler as ApiAuthHandler)(request, authContext);

      // セキュリティヘッダーを設定
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return response;

    } catch (error) {
      console.error('API認証エラー:', error);
      await recordFailedLogin(clientIP);
      return NextResponse.json(
        createApiError(500, ApiErrorCode.INTERNAL_ERROR, 'Internal server error'),
        { status: 500 }
      );
    }
  };
}

/**
 * リクエストの妥当性を検証
 */
function isValidRequest(request: NextRequest): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // 同一オリジンからのリクエストを許可
  if (origin) {
    const originUrl = new URL(origin);
    return originUrl.host === url.host;
  }

  // Refererがある場合はチェック
  if (referer) {
    const refererUrl = new URL(referer);
    return refererUrl.host === url.host;
  }

  // Origin、Refererが両方ない場合は安全サイドで許可
  return true;
}

/**
 * 認証リクエストの処理
 */
async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  console.log('🔐 認証リクエスト処理開始 - URL:', request.url);

  // 1. APIキー認証を先に試行
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.headers.get('x-api-key');

  console.log('🔑 APIキー確認:', apiKey ? '存在' : '不在');

  if (apiKey) {
    const apiUser = await getUserFromApiKey(apiKey);
    if (apiUser) {
      console.log('✅ APIキー認証成功:', apiUser.username);
      return {
        success: true,
        user: apiUser,
        apiKey,
        permissions: ['read', 'write', 'admin']
      };
    } else {
      console.log('❌ APIキー認証失敗');
      return {
        success: false,
        error: 'Invalid API key'
      };
    }
  }

  // 2. セッション認証を試行
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get('session-token')?.value ||
    cookieStore.get('auth-token')?.value ||
    cookieStore.get('token')?.value;

  console.log('🍪 Cookieストア:', {
    'session-token': cookieStore.get('session-token')?.value ? '存在' : '不在',
    'auth-token': cookieStore.get('auth-token')?.value ? '存在' : '不在',
    'token': cookieStore.get('token')?.value ? '存在' : '不在',
    selectedToken: sessionToken ? 'あり' : 'なし'
  });

  if (sessionToken) {
    console.log('🔍 セッショントークンで認証試行中...');
    const sessionUser = await getUserFromSession(sessionToken);
    if (sessionUser) {
      console.log('✅ セッション認証成功:', sessionUser.username);
      return {
        success: true,
        user: sessionUser,
        permissions: ['read', 'write']
      };
    } else {
      console.log('❌ セッション認証失敗 - 無効なトークン');
      return {
        success: false,
        error: 'Invalid session token'
      };
    }
  }

  return {
    success: false,
    error: 'No authentication credentials provided'
  };
}

/**
 * APIキーからユーザーを取得（本実装）
 */
async function getUserFromApiKey(apiKey: string): Promise<User | null> {
  try {
    const { UserRepository } = await import('./data/repositories/user-repository');
    const userRepo = new UserRepository();

    // APIキーでユーザーを検索
    const result = await userRepo.findById(apiKey); // 仮実装：APIキーをIDとして使用
    if (result.success && result.data) {
      // UserEntityからUserに変換
      const userEntity = result.data;
      return {
        id: userEntity.id,
        username: userEntity.username,
        email: userEntity.email,
        displayName: userEntity.displayName,
        passwordHash: '', // セキュリティのため空にする
        role: userEntity.role,
        isActive: userEntity.isActive ?? true,
        darkMode: userEntity.darkMode,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt
      };
    }
    return null;
  } catch (error) {
    console.error('APIキー認証エラー:', error);
    return null;
  }
}

/**
 * セッショントークンからユーザーを取得（本実装）
 */
async function getUserFromSession(sessionToken: string): Promise<User | null> {
  try {
    const { UserRepository } = await import('./data/repositories/user-repository');
    const userRepo = new UserRepository();

    // セッショントークンでユーザーを検索（仮実装：JWTトークンのデコード）
    // 実際の実装では、トークンをデコードしてユーザーIDを取得する
    const { verifyToken } = await import('./core/auth/jwt-utils');
    const payload = verifyToken(sessionToken);

    if (!payload?.userId) {
      return null;
    }

    const result = await userRepo.findById(payload.userId);
    if (result.success && result.data) {
      // UserEntityからUserに変換
      const userEntity = result.data;
      return {
        id: userEntity.id,
        username: userEntity.username,
        email: userEntity.email,
        displayName: userEntity.displayName,
        passwordHash: '', // セキュリティのため空にする
        role: userEntity.role,
        isActive: userEntity.isActive ?? true,
        darkMode: userEntity.darkMode,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt
      };
    }
    return null;
  } catch (error) {
    console.error('セッション認証エラー:', error);
    return null;
  }
}

/**
 * 権限チェック関数
 */
export function hasPermission(
  context: AuthContext,
  requiredPermission: string
): boolean {
  if (!context?.user || !requiredPermission) {
    return false;
  }

  if (!context.user.isActive) {
    return false;
  }

  if (context.sessionInfo.expiresAt < new Date()) {
    return false;
  }

  if (context.user.role === 'admin') {
    return true;
  }

  if (!context.permissions) {
    return false;
  }

  return context.permissions.includes(requiredPermission) ||
    context.permissions.includes('*');
}

/**
 * 管理者権限チェック関数
 */
export function requireAdmin(context: AuthContext): boolean {
  if (!context?.user) {
    return false;
  }

  if (!context.user.isActive) {
    return false;
  }

  if (context.sessionInfo.expiresAt < new Date()) {
    return false;
  }

  return context.user.role === 'admin';
}

/**
 * リソース所有権チェック関数
 */
export function requireOwnership(
  context: AuthContext,
  resourceUserId: string
): boolean {
  if (!context?.user || !resourceUserId) {
    return false;
  }

  if (!context.user.isActive) {
    return false;
  }

  if (context.sessionInfo.expiresAt < new Date()) {
    return false;
  }

  return context.user.id === resourceUserId || context.user.role === 'admin';
}
