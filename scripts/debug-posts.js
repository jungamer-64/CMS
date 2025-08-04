import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function debugPosts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB接続成功');
    
    const db = client.db();
    const posts = await db.collection('posts').find({}).toArray();
    
    console.log(`\n総投稿数: ${posts.length}`);
    console.log('\n投稿詳細:');
    
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. タイトル: ${post.title}`);
      console.log(`   スラッグ: ${post.slug}`);
      console.log(`   作成者: ${post.author || '未設定'}`);
      console.log(`   作成日: ${post.createdAt}`);
      console.log(`   更新日: ${post.updatedAt}`);
      console.log(`   公開: ${post.published ? 'はい' : 'いいえ'}`);
      console.log(`   ID: ${post._id}`);
    });
    
    // 公開済み投稿のみをカウント
    const publishedPosts = posts.filter(post => post.published);
    console.log(`\n公開済み投稿数: ${publishedPosts.length}`);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await client.close();
  }
}

debugPosts();
