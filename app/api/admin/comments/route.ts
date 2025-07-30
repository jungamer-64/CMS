import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/app/lib/users';
import { getAllCommentsForAdmin } from '@/app/lib/comments';

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
    
    const comments = await getAllCommentsForAdmin();

    return NextResponse.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error('管理者コメント取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'コメントの取得に失敗しました' },
      { status: error instanceof Error && error.message.includes('権限') ? 403 : 500 }
    );
  }
}
