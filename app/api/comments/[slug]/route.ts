import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getParams } from '@/app/lib/api-utils';
import { getCommentsByPostSlug } from '@/app/lib/comments';

// 特定の投稿のコメントを取得（GET）
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> }
) {
  console.log('コメント取得API呼び出し');
  
  try {
    const { slug } = await getParams(params);
    console.log('投稿スラッグ:', slug);

    if (!slug) {
      return createErrorResponse('投稿スラッグが必要です', 400);
    }

    // データベースから該当する投稿のコメントを取得（承認済みのみ）
    const comments = await getCommentsByPostSlug(slug, false);

    console.log(`投稿 "${slug}" のコメント数: ${comments.length}`);
    
    return createSuccessResponse(
      { comments }, 
      'コメント一覧を正常に取得しました'
    );
  } catch (error) {
    console.error('コメント取得エラー:', error);
    return createErrorResponse('コメントの取得中にエラーが発生しました', 500);
  }
}
