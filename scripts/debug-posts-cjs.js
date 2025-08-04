// データベースの投稿を確認するためのデバッグスクリプト
const fs = require('fs');

// .env.localファイルの内容を読み込み
const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');

// 環境変数を設定
envLines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const { MongoClient } = require('mongodb');

async function debugPosts() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI環境変数が設定されていません');
    return;
  }

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
      console.log(`   作成者: ${post.author || post.authorName || '未設定'}`);
      console.log(`   状態: ${post.status || '未設定'}`);
      console.log(`   公開(published): ${post.published}`);
      console.log(`   削除済み(isDeleted): ${post.isDeleted}`);
      console.log(`   作成日: ${post.createdAt}`);
      console.log(`   ID: ${post._id}`);
    });
    
    // 各種フィルターでの結果を確認
    console.log('\n=== フィルター結果 ===');
    
    // published: trueの投稿
    const publishedByFlag = await db.collection('posts').find({ published: true }).toArray();
    console.log(`published: true の投稿数: ${publishedByFlag.length}`);
    
    // status: 'published'の投稿
    const publishedByStatus = await db.collection('posts').find({ status: 'published' }).toArray();
    console.log(`status: 'published' の投稿数: ${publishedByStatus.length}`);
    
    // isDeleted: falseまたは存在しない投稿
    const notDeleted = await db.collection('posts').find({ 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] 
    }).toArray();
    console.log(`削除されていない投稿数: ${notDeleted.length}`);
    
    // status: 'published' AND isDeleted: false
    const publishedAndNotDeleted = await db.collection('posts').find({ 
      status: 'published',
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).toArray();
    console.log(`公開済みかつ削除されていない投稿数: ${publishedAndNotDeleted.length}`);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await client.close();
  }
}

debugPosts();
