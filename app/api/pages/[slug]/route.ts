import { NextRequest, NextResponse } from 'next/server';
import { getPageBySlug } from '../../../lib/pages';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'スラッグが指定されていません' },
        { status: 400 }
      );
    }

    const response = await getPageBySlug(slug);
    
    if (!response.success) {
      return NextResponse.json(response, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error('ページ取得エラー:', err instanceof Error ? err : String(err));
    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}
