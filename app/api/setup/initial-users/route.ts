import { NextResponse } from 'next/server';
import { userRepository } from '@/app/lib/data/repositories/user-repository';

export async function POST() {
  try {
    
    // 初期ユーザーデータ
    const initialUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin' as const,
        displayName: 'Administrator'
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: 'user123',
        role: 'user' as const,
        displayName: 'Test User'
      },
      {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        role: 'user' as const,
        displayName: 'Test Account'
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of initialUsers) {
      // 既存ユーザーをチェック
      const existingUser = await userRepository.findByUsername(userData.username);
      if (existingUser) {
        console.log(`ユーザー ${userData.username} は既に存在しています`);
        continue;
      }
      
      // ユーザー作成
      await userRepository.create({
        username: userData.username,
        email: userData.email,
        password: userData.password, // リポジトリ内でハッシュ化される
        role: userData.role,
        displayName: userData.displayName,
        darkMode: false
      });
      
      createdUsers.push({
        username: userData.username,
        email: userData.email,
        role: userData.role,
        displayName: userData.displayName
      });
    }
    
    return NextResponse.json({
      message: '初期ユーザーの作成が完了しました',
      createdUsers
    });
    
  } catch (error) {
    console.error('初期ユーザー作成エラー:', error);
    return NextResponse.json(
      { error: '初期ユーザーの作成に失敗しました' },
      { status: 500 }
    );
  }
}
