import { NextRequest, NextResponse } from 'next/server';
import { createPost } from '@/app/lib/posts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, author, slug: customSlug } = body;

    if (!title || !content || !author) {
      return NextResponse.json(
        { error: 'タイトル、内容、著者は必須です' },
        { status: 400 }
      );
    }

    // 新しい投稿のIDを生成
    const id = Date.now().toString();
    
    let finalSlug: string;
    
    if (customSlug?.trim()) {
      // カスタムslugが提供された場合はそれを使用
      finalSlug = customSlug.trim();
    } else {
      // カスタムslugがない場合は、タイトルから自動生成
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // 英数字とスペースのみ残す
        .replace(/\s+/g, '-') // スペースをハイフンに変換
        .replace(/-+/g, '-') // 連続するハイフンを単一に
        .replace(/(^-+)|(-+$)/g, '') // 先頭末尾のハイフンを削除
        .trim();
      
      // baseSlugが空またはタイトルに日本語が多い場合は、投稿IDベースのslugを使用
      finalSlug = baseSlug && baseSlug.length >= 3 
        ? `${baseSlug}-${id}` 
        : `post-${id}`;
    }

    const postData = {
      id,
      slug: finalSlug,
      title,
      content,
      author,
      createdAt: new Date(),
    };

    const newPost = await createPost(postData);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('投稿作成エラー:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}
