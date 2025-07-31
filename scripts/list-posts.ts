import { config } from 'dotenv';

// 最初に.env.localファイルを読み込み
config({ path: '.env.local' });

import { getPostsCollection } from '../app/lib/posts';

async function listPosts() {
  try {
    console.log('保存されている投稿データを確認中...');
    const collection = await getPostsCollection();
    const posts = await collection.find({}).toArray();
    
    console.log(`\n📊 投稿数: ${posts.length}`);
    console.log('=' .repeat(50));
    
    posts.forEach((post, index) => {
      console.log(`\n📝 投稿 ${index + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  タイトル: ${post.title}`);
      console.log(`  スラッグ: ${post.slug}`);
      console.log(`  作成者: ${post.author}`);
      console.log(`  作成日: ${post.createdAt.toLocaleString()}`);
      console.log(`  更新日: ${post.updatedAt ? post.updatedAt.toLocaleString() : '未設定'}`);
      console.log(`  削除済み: ${post.isDeleted ? 'はい' : 'いいえ'}`);
      console.log(`  MongoDB _id: ${post._id}`);
    });
    
    console.log('\n💾 保存場所情報:');
    console.log(`  データベース: test-website`);
    console.log(`  コレクション: posts`);
    console.log(`  接続先: mongodb://localhost:27017`);
    
  } catch (error) {
    console.error('❌ 投稿データ取得エラー:', error);
  }
}

listPosts().then(() => process.exit(0));
