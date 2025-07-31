import { NextRequest, NextResponse } from 'next/server';
import { createPost } from '@/app/lib/posts';
import { validateApiKey, checkRateLimit } from '@/app/lib/api-auth';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // クライアントIPを取得
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '127.0.0.1';

    // レート制限チェック（1分間に5投稿まで）
    const rateLimitResult = checkRateLimit(ip, 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // API認証
    const authResult = validateApiKey(request, { resource: 'posts', action: 'create' });
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

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
    return NextResponse.json({
      success: true,
      message: '投稿が正常に作成されました',
      post: newPost
    }, { status: 201 });
  } catch (error) {
    console.error('投稿作成エラー:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿一覧を取得（API認証必要）
export async function GET(request: NextRequest) {
  try {
    // API認証
    const authResult = validateApiKey(request, { resource: 'posts', action: 'read' });
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // 投稿を取得（実装が必要）
    const { getAllPosts } = await import('@/app/lib/posts');
    const { posts, total } = await getAllPosts({ page, limit, search });

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}
