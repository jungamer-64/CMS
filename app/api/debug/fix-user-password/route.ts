import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { getDatabase } from '@/app/lib/data/connections/mongodb';
import bcrypt from 'bcryptjs';

// チE��チE��用のユーザー修正API�E�開発環墁E�Eみ�E�E
export async function POST(request: NextRequest) {
  try {
    // 開発環墁E��のみ実衁E
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(createErrorResponse('本番環墁E��は実行できません', 403), { status: 403 });
    }

    const body = await request.json();
    const { username, newPassword } = body;

    if (!username || !newPassword) {
      return NextResponse.json(createErrorResponse('ユーザー名と新しいパスワードが必要です', 400), { status: 400 });
    }

    const db = await getDatabase();
    const users = db.collection('users');
    
    // ユーザーを検索
    const user = await users.findOne({ username });
    
    if (!user) {
      return NextResponse.json(createErrorResponse(`ユーザー "${username}" が見つかりません`, 404), { status: 404 });
    }
    
    console.log('🔧 ユーザーパスワード修正:', username);
    
    // 新しいパスワードハチE��ュを生戁E
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // パスワードハチE��ュを更新
    const result = await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✁EパスワードハチE��ュが正常に更新されました');
      return NextResponse.json(createSuccessResponse(
        { username, updated: true },
        'パスワードが正常に更新されました'
      ));
    } else {
      return NextResponse.json(createErrorResponse('パスワード�E更新に失敗しました', 500), { status: 500 });
    }
    
  } catch (err: unknown) {
    console.error('❁Eユーザー修正エラー:', err instanceof Error ? err : String(err));
    return NextResponse.json(createErrorResponse('冁E��エラーが発生しました', 500), { status: 500 });
  }
}
