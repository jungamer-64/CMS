/**
 * 既存データベース投稿確認スクリプト
 */

import { connectToDatabase, getDatabase } from '../app/lib/database/connection';

async function checkExistingPosts() {
  console.log('🔍 既存投稿データ確認中...\n');

  try {
    // データベース接続
    await connectToDatabase();
    const db = getDatabase();
    
    // 投稿コレクション確認
    const postsCollection = db.collection('posts');
    
    // 全投稿取得
    const posts = await postsCollection.find({}).toArray();
    console.log(`📊 投稿総数: ${posts.length}件\n`);
    
    // 各投稿の詳細表示
    posts.forEach((post, index) => {
      console.log(`📝 投稿 ${index + 1}:`);
      console.log(`   ID: ${post.id || post._id}`);
      console.log(`   タイトル: ${post.title}`);
      console.log(`   作成者: ${post.author || post.authorName || post.authorId}`);
      console.log(`   スラッグ: ${post.slug}`);
      console.log(`   ステータス: ${post.status || '不明'}`);
      console.log(`   削除済み: ${post.isDeleted || 'フィールドなし'}`);
      console.log(`   タグ: ${post.tags ? JSON.stringify(post.tags) : '不明'}`);
      console.log(`   カテゴリ: ${post.categories ? JSON.stringify(post.categories) : '不明'}`);
      console.log(`   作成日: ${post.createdAt}`);
      console.log(`   更新日: ${post.updatedAt}\n`);
    });

    // 利用可能なフィールド確認
    if (posts.length > 0) {
      console.log('🔑 利用可能なフィールド:');
      const fields = Object.keys(posts[0]);
      fields.forEach(field => {
        console.log(`   - ${field}`);
      });
    }

  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  checkExistingPosts()
    .then(() => {
      console.log('\n✅ 確認完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 確認失敗:', error);
      process.exit(1);
    });
}

export default checkExistingPosts;
