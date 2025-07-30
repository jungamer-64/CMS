import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { username, secret } = await request.json();

    // 簡単なシークレットキーで保護
    if (secret !== 'admin-upgrade-secret-123') {
      return NextResponse.json({ error: '無効なシークレットキーです' }, { status: 403 });
    }

    const db = await getDatabase();
    
    // ユーザーのロールを管理者に変更
    const result = await db.collection('users').updateOne(
      { username: username },
      { $set: { role: 'admin' } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新後のユーザー情報を取得
    const updatedUser = await db.collection('users').findOne(
      { username: username },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      message: `ユーザー "${username}" を管理者にアップグレードしました`,
      user: updatedUser
    });

  } catch (error) {
    console.error('管理者アップグレードエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
