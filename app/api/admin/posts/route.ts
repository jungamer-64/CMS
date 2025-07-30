import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/app/lib/users';
import { getAllPostsForAdmin, deletePost, restorePost, permanentlyDeletePost } from '@/app/lib/posts';

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
    
    const posts = await getAllPostsForAdmin();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('投稿一覧取得エラー:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('認証') ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: '投稿一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!postId) {
      return NextResponse.json(
        { error: '投稿IDが必要です' },
        { status: 400 }
      );
    }

    let success;
    if (permanent) {
      success = await permanentlyDeletePost(postId);
    } else {
      success = await deletePost(postId);
    }

    if (!success) {
      return NextResponse.json(
        { error: '投稿の削除に失敗しました' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: permanent ? '投稿を完全に削除しました' : '投稿を削除しました' 
    });
  } catch (error) {
    console.error('投稿削除エラー:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('認証') ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const { action, postId } = await request.json();

    if (!postId || !action) {
      return NextResponse.json(
        { error: '投稿IDとアクションが必要です' },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    switch (action) {
      case 'restore':
        success = await restorePost(postId);
        message = '投稿を復元しました';
        break;
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'アクションの実行に失敗しました' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('投稿操作エラー:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('認証') ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: 'アクションの実行に失敗しました' },
      { status: 500 }
    );
  }
}
