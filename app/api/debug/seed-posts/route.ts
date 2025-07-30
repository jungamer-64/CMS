import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

export async function POST() {
  try {
    const db = await getDatabase();
    
    // テスト投稿データ
    const testPosts = [
      {
        id: 'test-post-1',
        title: 'Welcome to our blog',
        slug: 'welcome-to-our-blog',
        content: 'これは最初のテスト投稿です。ブログシステムが正常に動作していることを確認するためのサンプル投稿です。',
        author: 'testuser',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        isDeleted: false
      },
      {
        id: 'test-post-2',
        title: '管理者システムのテスト',
        slug: 'admin-system-test',
        content: '管理者システムの動作をテストするための投稿です。削除や復元の機能をテストできます。',
        author: 'admin',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        isDeleted: false
      },
      {
        id: 'test-post-3',
        title: '削除されたテスト投稿',
        slug: 'deleted-test-post',
        content: 'この投稿は削除状態をテストするためのものです。',
        author: 'testuser',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25'),
        isDeleted: true
      }
    ];

    // 既存の投稿をクリア（開発環境のみ）
    await db.collection('posts').deleteMany({});
    
    // テスト投稿を挿入
    const result = await db.collection('posts').insertMany(testPosts);
    
    return NextResponse.json({
      message: 'テスト投稿データを作成しました',
      insertedCount: result.insertedCount,
      posts: testPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        author: post.author,
        isDeleted: post.isDeleted
      }))
    });
    
  } catch (error) {
    console.error('テストデータ作成エラー:', error);
    return NextResponse.json(
      { error: 'テストデータ作成に失敗しました', details: error },
      { status: 500 }
    );
  }
}
