import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, validatePasswordResetToken } from '@/app/lib/users';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'トークンとパスワードは必須です' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    // トークンの検証
    const resetToken = await validatePasswordResetToken(token);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'トークンが無効か期限切れです' },
        { status: 400 }
      );
    }

    // パスワードをリセット
    const success = await resetPassword(token, password);
    if (!success) {
      return NextResponse.json(
        { error: 'パスワードのリセットに失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'パスワードが正常にリセットされました' 
    });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセットの処理に失敗しました' },
      { status: 500 }
    );
  }
}
