import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

// .env.localファイルを読み込み
config({ path: '.env.local' });

async function checkAtlasUsers() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('使用中のMONGODB_URI:', uri?.substring(0, 30) + '...');
    
    if (!uri) {
      console.error('❌ MONGODB_URI環境変数が設定されていません');
      return false;
    }
    
    console.log('🔗 MongoDB Atlasに直接接続中...');
    
    const client = new MongoClient(uri);
    await client.connect();
    
    // usersコレクションを確認
    const db = client.db('test-website');
    const usersCollection = db.collection('users');
    
    const users = await usersCollection.find({}).toArray();
    console.log(`\n📊 ユーザー数: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 ユーザー ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  ユーザー名: ${user.username}`);
      console.log(`  メール: ${user.email}`);
      console.log(`  パスワードハッシュ: ${user.passwordHash?.substring(0, 20)}...`);
      console.log(`  作成日: ${user.createdAt}`);
    });
    
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Atlas接続エラー:', error);
    return false;
  }
}

// 直接実行
if (require.main === module) {
  checkAtlasUsers().then(() => process.exit(0));
}

export { checkAtlasUsers };
