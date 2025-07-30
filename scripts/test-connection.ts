import clientPromise from '../app/lib/mongodb';

async function testConnection() {
  try {
    console.log('MongoDBへの接続をテスト中...');
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDBに正常に接続できました！');
    
    // データベースとコレクションの一覧を確認
    const db = client.db('test-website');
    const collections = await db.listCollections().toArray();
    console.log('既存のコレクション:', collections.map(c => c.name));
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB接続エラー:', error);
    return false;
  }
}

// 直接実行
testConnection().then(() => process.exit(0));

export { testConnection };
