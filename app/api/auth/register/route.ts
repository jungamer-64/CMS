import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/app/lib/users';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, displayName } = await request.json();

    if (!username || !email || !password || !displayName) {
      return NextResponse.json(
        { error: '全ての項目を入力してください' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    const user = await createUser({ username, email, password, displayName });
    
    // パスワードハッシュを除いてユーザー情報を返す
    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    
    if (error instanceof Error && error.message.includes('既に使用されています')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}
