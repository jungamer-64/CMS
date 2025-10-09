import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/app/lib/data/repositories/post-repository';
import {
  createRestErrorResponse,
  HttpStatus,
  RestErrorCode,
} from '@/app/lib/api/utils/rest-helpers';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 特定の投稿を取得（公開API）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        createRestErrorResponse(RestErrorCode.VALIDATION_FAILED, 'スラッグが必要です'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    console.log('Searching for post with slug:', slug);
    const postResult = await postRepository.findBySlug(slug);
    console.log('Found post result:', postResult);
    
    // postRepositoryが { success: true, data: post } 形式で返す場合
    const post = postResult && typeof postResult === 'object' && 'data' in postResult 
      ? postResult.data 
      : postResult;
    
    console.log('Extracted post:', post);
    
    if (!post) {
      return NextResponse.json(
        createRestErrorResponse(RestErrorCode.RESOURCE_NOT_FOUND, '投稿が見つかりません'),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    console.log('Creating response for post:', post);
    
    const responseData = {
      success: true,
      data: {
        ...post,
        // authorフィールドが存在しない場合のフォールバック
        author: 'author' in post ? post.author : '管理者'
      },
      meta: { message: '投稿を取得しました' },
      timestamp: new Date().toISOString()
    };
    console.log('API Response data:', responseData);
    
    return NextResponse.json(responseData);
  } catch (err: unknown) {
    console.error('投稿取得エラー:', err instanceof Error ? err : String(err));
    return NextResponse.json(
      createRestErrorResponse(RestErrorCode.INTERNAL_ERROR, '投稿の取得に失敗しました'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}