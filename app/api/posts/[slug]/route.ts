import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, updatePost, deletePost } from '@/app/lib/posts';
import { validateApiKey } from '@/app/lib/api-auth';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    
    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: paramSlug } = await params;
  try {
    // API認証
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, slug } = body;

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: 'タイトル、内容、スラッグは必須です' },
        { status: 400 }
      );
    }

    // 現在の投稿を取得
    const existingPost = await getPostBySlug(paramSlug);
    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    const updateData = {
      title,
      content,
      slug,
      updatedAt: new Date(),
    };

    const updatedPost = await updatePost(existingPost.id, updateData);
    return NextResponse.json({
      success: true,
      message: '投稿が正常に更新されました',
      post: updatedPost
    });
  } catch (error) {
    console.error('投稿更新エラー:', error);
    return NextResponse.json(
      { error: '投稿の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿を削除（API認証必要）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    // API認証
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // 投稿の存在確認
    const existingPost = await getPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿を削除
    await deletePost(existingPost.id);

    return NextResponse.json({
      success: true,
      message: '投稿が正常に削除されました'
    });
  } catch (error) {
    console.error('投稿削除エラー:', error);
    return NextResponse.json(
      { error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}
