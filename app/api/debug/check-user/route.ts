import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { getDatabase } from '@/app/lib/data/connections/mongodb';

// デバッグ用のユーザー情報確認API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(createErrorResponse('ユーザー名が必要です', 400), { status: 400 });
    }

    const db = await getDatabase();
    const users = db.collection('users');
    
    // ユーザーを検索
    const user = await users.findOne({ username });
    
    if (!user) {
      return NextResponse.json(createErrorResponse(`ユーザー "${username}" が見つかりません`, 404), { status: 404 });
    }
    
    console.log('🔍 ユーザー詳細情報:', {
      _id: user._id,
      username: user.username,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length || 0,
      passwordHashFirst10: user.passwordHash ? user.passwordHash.substring(0, 10) + '...' : 'なし',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      fields: Object.keys(user)
    });
    
    return NextResponse.json(createSuccessResponse({
      id: user._id,
      username: user.username,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      allFields: Object.keys(user)
    }));
    
  } catch (err: unknown) {
    console.error('❌ ユーザー情報確認エラー:', err instanceof Error ? err : String(err));
    return NextResponse.json(createErrorResponse('内部エラーが発生しました', 500), { status: 500 });
  }
}
