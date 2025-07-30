import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

// .env.localファイルを読み込み
config({ path: '.env.local' });

async function testAtlasConnection() {
  try {
    const atlasUri = process.env.MONGODB_ATLAS_URI;
    
    if (!atlasUri) {
      console.error('❌ MONGODB_ATLAS_URI環境変数が設定されていません');
      console.log('例: mongodb+srv://username:password@cluster.mongodb.net/test-website');
      return false;
    }
    
    console.log('🔗 MongoDB Atlasへの接続をテスト中...');
    
    const client = new MongoClient(atlasUri);
    await client.connect();
    
    // 接続テスト
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB Atlasに正常に接続できました！');
    
    // データベース情報を確認
    const db = client.db('test-website');
    const collections = await db.listCollections().toArray();
    console.log('📊 データベース: test-website');
    console.log('📁 コレクション:', collections.map(c => c.name));
    
    // 各コレクションのドキュメント数を確認
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count}件`);
    }
    
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Atlas接続エラー:', error);
    return false;
  }
}

// 直接実行
if (require.main === module) {
  testAtlasConnection().then(() => process.exit(0));
}

export { testAtlasConnection };
