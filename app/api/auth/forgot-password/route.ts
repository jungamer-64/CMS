import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken, getUserByEmail } from '@/app/lib/users';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスは必須です' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const user = await getUserByEmail(email);
    if (!user) {
      // セキュリティ上、ユーザーが存在しなくても同じレスポンスを返す
      return NextResponse.json({ 
        message: 'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）' 
      });
    }

    // パスワードリセットトークンを生成
    const resetToken = await createPasswordResetToken(email);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'パスワードリセットトークンの生成に失敗しました' },
        { status: 500 }
      );
    }

    // 実際のプロダクションではここでメール送信を行う
    // 開発環境では、コンソールにリセットリンクを表示
    console.log('\n=== パスワードリセットリンク ===');
    console.log(`ユーザー: ${user.displayName} (${user.email})`);
    console.log(`リセットリンク: http://localhost:3000/auth/reset-password?token=${resetToken.token}`);
    console.log('================================\n');

    return NextResponse.json({ 
      message: 'パスワードリセットのメールを送信しました（該当するアカウントが存在する場合）',
      // 開発環境でのみトークンを返す
      ...(process.env.NODE_ENV === 'development' && { 
        developmentToken: resetToken.token,
        resetLink: `http://localhost:3000/auth/reset-password?token=${resetToken.token}`
      })
    });
  } catch (error) {
    console.error('パスワードリセット要求エラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセット要求の処理に失敗しました' },
      { status: 500 }
    );
  }
}
