import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // 全投稿数を取得
    const totalPosts = await db.collection('posts').countDocuments();
    
    // 公開中の投稿数を取得
    const publishedPosts = await db.collection('posts').countDocuments({ 
      isDeleted: { $ne: true } 
    });
    
    // 削除済みの投稿数を取得
    const deletedPosts = await db.collection('posts').countDocuments({ 
      isDeleted: true 
    });
    
    // 実際の投稿データも取得（最初の5件）
    const samplePosts = await db.collection('posts').find({}).limit(5).toArray();
    
    return NextResponse.json({
      stats: {
        total: totalPosts,
        published: publishedPosts,
        deleted: deletedPosts
      },
      samplePosts: samplePosts.map(post => ({
        id: post.id || post._id?.toString(),
        title: post.title,
        slug: post.slug,
        author: post.author,
        isDeleted: post.isDeleted,
        createdAt: post.createdAt
      }))
    });
    
  } catch (error) {
    console.error('データベース調査エラー:', error);
    return NextResponse.json(
      { error: 'データベースエラー', details: error },
      { status: 500 }
    );
  }
}
