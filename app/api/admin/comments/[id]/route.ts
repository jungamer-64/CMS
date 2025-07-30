import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/app/lib/users';
import { deleteComment } from '@/app/lib/comments';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    
    const success = await deleteComment(id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'コメントを削除しました'
      });
    } else {
      return NextResponse.json(
        { error: 'コメントが見つかりません' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('コメント削除エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'コメントの削除に失敗しました' },
      { status: error instanceof Error && error.message.includes('権限') ? 403 : 500 }
    );
  }
}
