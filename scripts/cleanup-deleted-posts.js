// 削除済み投稿をデータベースから完全に削除するスクリプト
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

const { MongoClient, ObjectId } = require('mongodb');

async function cleanupDeletedPosts() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI環境変数が設定されていません');
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB接続成功');
    
    const db = client.db();
    
    // 削除済み投稿を確認
    const deletedPosts = await db.collection('posts').find({ isDeleted: true }).toArray();
    console.log(`削除済み投稿数: ${deletedPosts.length}`);
    
    if (deletedPosts.length > 0) {
      console.log('\n削除済み投稿:');
      deletedPosts.forEach((post, index) => {
        console.log(`${index + 1}. タイトル: ${post.title} (ID: ${post._id})`);
      });
      
      // 削除済み投稿を完全に削除
      const result = await db.collection('posts').deleteMany({ isDeleted: true });
      console.log(`\n${result.deletedCount}件の削除済み投稿を完全に削除しました`);
    } else {
      console.log('削除済み投稿はありません');
    }
    
    // 残った投稿を確認
    const remainingPosts = await db.collection('posts').find({}).toArray();
    console.log(`\n残った投稿数: ${remainingPosts.length}`);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await client.close();
  }
}

cleanupDeletedPosts();
