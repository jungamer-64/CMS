import { setupApiKeyIndexes } from '../app/lib/setup-indexes';
import { getDatabase, COLLECTIONS } from '../app/lib/data/connections/mongodb';

async function initializeApiKeySystem() {
  console.log('APIキーシステムの初期化を開始します...');
  
  try {
    // インデックスを設定
    await setupApiKeyIndexes();
    
    // コレクションの存在確認
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    if (!collectionNames.includes(COLLECTIONS.API_KEYS)) {
      console.log('APIキーコレクションを作成します...');
      await db.createCollection(COLLECTIONS.API_KEYS);
    }
    
    console.log('APIキーシステムの初期化が完了しました！');
    console.log('\n使用方法:');
    console.log('1. 管理画面 (/admin/api-keys) でAPIキーを作成');
    console.log('2. APIリクエストのヘッダーに以下を追加:');
    console.log('   X-API-Key: あなたのAPIキー');
    console.log('   または');
    console.log('   Authorization: Bearer あなたのAPIキー');
    console.log('\n3. テストエンドポイント:');
    console.log('   GET /api/test - 読み取り権限テスト');
    console.log('   POST /api/test - 投稿作成権限テスト');
    
  } catch (error) {
    console.error('初期化エラー:', error);
    process.exit(1);
  }
}

initializeApiKeySystem();
