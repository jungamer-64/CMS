import { createUnifiedError, handleApiError, handleSuccess } from '@/app/lib/core/error-handler';
import { isApiSuccess } from '@/app/lib/core/utils/type-guards';
import { UserRepository } from '@/app/lib/data/repositories/user-repository';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// 環境変数からJWTシークレットを取得
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// ログイン要求の型
interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

// 認証レスポンスの型
interface AuthResponse {
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly email: string;
    readonly displayName: string;
    readonly role: 'admin' | 'user';
    readonly isActive: boolean;
    readonly lastLogin?: Date;
    readonly preferences?: Record<string, unknown>;
  };
  readonly token?: string;
  readonly expiresAt?: Date;
}

// ログインAPI
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    console.log('ログイン試行開始:', { username, passwordLength: password?.length });

    // 基本的なバリデーション
    if (!username || !password) {
      const validationError = createUnifiedError.validation('ユーザー名とパスワードが必要です');
      return handleApiError(validationError, { location: '/api/auth/login' });
    }

    // データベースでユーザー認証
    const userRepository = new UserRepository();
    const authResult = await userRepository.authenticateUser(username, password);

    console.log('ユーザー認証結果:', {
      success: isApiSuccess(authResult),
      hasData: isApiSuccess(authResult) ? !!authResult.data : false
    });

    if (!isApiSuccess(authResult) || !authResult.data) {
      console.log('認証失敗');
      const errorMessage = !isApiSuccess(authResult) ? authResult.error : 'ユーザー名またはパスワードが正しくありません';
      const authError = createUnifiedError.unauthorized(errorMessage);
      return handleApiError(authError, { location: '/api/auth/login' });
    }

    const user = authResult.data;

    // 最終ログイン時刻を更新
    await userRepository.updateLastLogin(user.id);

    // JWTトークンを生成
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const userResponse: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive ?? true,
        lastLogin: new Date(),
        preferences: user.darkMode ? { darkMode: user.darkMode } : {}
      },
      token,
      expiresAt
    };

    // Cookieにトークンを設定
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7日間
    });

    console.log('ログイン成功:', {
      userId: user.id,
      username: user.username,
      tokenLength: token.length
    });

    return handleSuccess(userResponse, 'ログインに成功しました');

  } catch (err: unknown) {
    console.error('ログインエラー:', err instanceof Error ? err : String(err));
    return handleApiError(err, { location: '/api/auth/login' });
  }
}
