import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, updatePost } from '@/app/lib/posts';

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
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('投稿更新エラー:', error);
    return NextResponse.json(
      { error: '投稿の更新に失敗しました' },
      { status: 500 }
    );
  }
}
