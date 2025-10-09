import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 環境変数からJWTシークレットを取得
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// 簡単な成功・エラーレスポンス作成関数
function createApiSuccess<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 200 });
}

function createApiError(error: string, code: number = 500) {
  return NextResponse.json({ success: false, error }, { status: code });
}

// 登録要求の型
interface RegisterRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
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

// ユーザー登録API
export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { username, email, password, displayName } = body;

    console.log('ユーザー登録開始:', { username, email, displayName });

    // 基本的なバリデーション
    if (!username || !email || !password) {
      return createApiError('ユーザー名、メールアドレス、パスワードが必要です', 400);
    }

    if (password.length < 6) {
      return createApiError('パスワードは6文字以上である必要があります', 400);
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createApiError('有効なメールアドレスを入力してください', 400);
    }

    // 既存ユーザーのチェック（モック）
    // 実装時は実際のDBで重複チェック
    if (username === 'admin' || email === 'admin@example.com') {
      return createApiError('そのユーザー名またはメールアドレスは既に使用されています', 409);
    }

    // パスワードをハッシュ化
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 新しいユーザーを作成（モック）
    const newUser = {
      id: `user-${Date.now()}`,
      username,
      email,
      displayName: displayName || username,
      role: 'user' as const,
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('ユーザー作成成功:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    });

    // JWTトークンを生成
    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const userResponse: AuthResponse = {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        isActive: newUser.isActive,
        lastLogin: new Date(),
        preferences: { darkMode: false }
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

    console.log('ユーザー登録完了:', {
      userId: newUser.id,
      tokenLength: token.length
    });

    return createApiSuccess(userResponse, 'ユーザー登録に成功しました');

  } catch (err: unknown) {
    console.error('ユーザー登録エラー:', err instanceof Error ? err : String(err));
    return createApiError(
      err instanceof Error ? err.message : 'ユーザー登録に失敗しました',
      500
    );
  }
}
