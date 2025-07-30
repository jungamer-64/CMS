import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById, getAllUsers, updateUserRole } from '@/app/lib/users';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    throw new Error('認証が必要です');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const user = await getUserById(decoded.userId);
  
  if (!user || user.role !== 'admin') {
    throw new Error('管理者権限が必要です');
  }
  
  return user;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const users = await getAllUsers();
    // パスワードハッシュを除外
    const safeUsers = users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
    
    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('認証') ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'ユーザーIDとロールが必要です' },
        { status: 400 }
      );
    }

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json(
        { error: '無効なロールです' },
        { status: 400 }
      );
    }

    const success = await updateUserRole(userId, role);

    if (!success) {
      return NextResponse.json(
        { error: 'ロールの更新に失敗しました' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: `ユーザーのロールを${role}に更新しました` 
    });
  } catch (error) {
    console.error('ロール更新エラー:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('認証') ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: 'ロールの更新に失敗しました' },
      { status: 500 }
    );
  }
}
