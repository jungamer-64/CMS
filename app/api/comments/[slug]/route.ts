import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByPostSlug } from '@/app/lib/comments';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // 承認済みのコメントのみを取得
    const comments = await getCommentsByPostSlug(slug, false);

    return NextResponse.json({
      success: true,
      comments: comments.map(comment => ({
        id: comment.id,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt
      }))
    });

  } catch (error) {
    console.error('コメント取得エラー:', error);
    return NextResponse.json(
      { error: 'コメントの取得に失敗しました' },
      { status: 500 }
    );
  }
}
