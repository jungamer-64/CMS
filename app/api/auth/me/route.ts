import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/app/lib/users';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // JWTトークンの検証
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // パスワードハッシュを除いてユーザー情報を返す
    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('認証エラー:', error);
    return NextResponse.json(
      { error: '認証に失敗しました' },
      { status: 401 }
    );
  }
}
