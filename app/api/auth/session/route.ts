import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// JWT ペイロードの型定義
interface JWTPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

// 環境変数からJWTシークレットを取得
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// 簡単な成功・エラーレスポンス作成関数
function createApiSuccess<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 200 });
}

function createApiError(error: string, code: number = 500) {
  return NextResponse.json({ success: false, error }, { status: code });
}

// セッション情報型
interface UserSessionInfo {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: 'admin' | 'user';
  readonly isActive: boolean;
  readonly lastLogin?: Date;
  readonly preferences?: Record<string, unknown>;
}

// セッション情報取得 (GET)
export async function GET() {
  try {
    console.log('セッション確認開始');
    
    // 認証チェック
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken?.value) {
      return createApiError('認証情報がありません', 401);
    }

    // JWTトークンを検証
    let decodedToken: JWTPayload;
    try {
      decodedToken = jwt.verify(authToken.value, JWT_SECRET) as JWTPayload;
      console.log('JWT検証成功:', { userId: decodedToken.userId, username: decodedToken.username });
    } catch (jwtError) {
      console.log('JWT検証失敗:', jwtError);
      return createApiError('無効な認証トークンです', 401);
    }

    // データベースから実際のユーザー情報を取得
    const userRepository = await import('@/app/lib/data/repositories/user-repository');
    const userResult = await userRepository.userRepository.findById(decodedToken.userId);
    
    if (!userResult.success || !userResult.data) {
      console.log('ユーザーが見つかりません:', decodedToken.userId);
      return createApiError('ユーザーが見つかりません', 404);
    }
    
    const user = userResult.data;

    // 実際のユーザーデータからセッション情報を構築
    const userInfo: UserSessionInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName, // データベースから取得した正しいdisplayName
      role: user.role,
      isActive: user.isActive !== false,
      lastLogin: new Date(),
      preferences: { darkMode: user.darkMode || false }
    };

    console.log('セッション情報取得成功:', userInfo);
    return createApiSuccess({ user: userInfo }, 'セッション情報を取得しました');

  } catch (error) {
    console.error('セッション確認エラー:', error);
    return createApiError(
      error instanceof Error ? error.message : 'セッション確認に失敗しました',
      500
    );
  }
}

// ログアウト (DELETE)
export async function DELETE() {
  try {
    console.log('ログアウト処理開始');

    // セッションクッキーを削除
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    
    console.log('ログアウト処理完了');
    return createApiSuccess(
      { message: 'ログアウトしました' }, 
      'ログアウトしました'
    );
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return createApiError(
      'ログアウト処理に失敗しました',
      500
    );
  }
}
