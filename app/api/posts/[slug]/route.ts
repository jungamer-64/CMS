import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, updatePostBySlug, deletePostBySlug } from '@/app/lib/posts';
import { validateApiKey, checkRateLimit, validateUserSession } from '@/app/lib/api-auth';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 特定の投稿を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'スラッグが必要です' },
        { status: 400 }
      );
    }

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

// 投稿を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'スラッグが必要です' },
        { status: 400 }
      );
    }

    // クライアントIPを取得
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '127.0.0.1';

    // レート制限チェック（1分間に10更新まで）
    const rateLimitResult = checkRateLimit(ip, 10, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // ユーザーセッション認証を試行（ウェブインターフェース用）
    const userValidation = await validateUserSession(request);
    
    // セッション認証が失敗した場合、APIキー認証を試行
    if (!userValidation.valid) {
      const authResult = await validateApiKey(request, { resource: 'posts', action: 'update' });
      if (!authResult.valid) {
        return NextResponse.json(
          { error: authResult.error },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { title, content, slug: newSlug } = body;

    if (!title || !content || !newSlug) {
      return NextResponse.json(
        { error: 'タイトル、内容、スラッグは必須です' },
        { status: 400 }
      );
    }

    // 既存の投稿を確認
    const existingPost = await getPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    const updatedPost = await updatePostBySlug(slug, {
      title,
      content,
      slug: newSlug,
      updatedAt: new Date(),
    });

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

// 投稿を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'スラッグが必要です' },
        { status: 400 }
      );
    }

    // クライアントIPを取得
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '127.0.0.1';

    // レート制限チェック（1分間に5削除まで）
    const rateLimitResult = checkRateLimit(ip, 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // ユーザーセッション認証を試行（ウェブインターフェース用）
    const userValidation = await validateUserSession(request);
    
    // セッション認証が失敗した場合、APIキー認証を試行
    if (!userValidation.valid) {
      const authResult = await validateApiKey(request, { resource: 'posts', action: 'delete' });
      if (!authResult.valid) {
        return NextResponse.json(
          { error: authResult.error },
          { status: 401 }
        );
      }
    }

    // 既存の投稿を確認
    const existingPost = await getPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    await deletePostBySlug(slug);

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
