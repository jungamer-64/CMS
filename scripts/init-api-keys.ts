import { COLLECTIONS, getDatabase } from '../app/lib/data/connections/mongodb';
import { setupApiKeyIndexes } from '../app/lib/setup-indexes';

function sanitizeForLog(value: any): string {
  try {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.replace(/\r?\n|[\u0000-\u001F\u007F]/g, ' ').slice(0, 300);
    if (typeof value === 'object') return JSON.stringify(value).replace(/\r?\n|[\u0000-\u001F\u007F]/g, ' ').slice(0, 300);
    return String(value).replace(/\r?\n|[\u0000-\u001F\u007F]/g, ' ').slice(0, 300);
  } catch (e) {
    return String(value);
  }
}

export async function initializeApiKeySystem() {
  console.log('APIキーシステムの初期化を開始します...');

  try {
    // インデックスを設定
    await setupApiKeyIndexes();

    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col: any) => col.name);

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

  } catch (err) {
    console.error('初期化エラー: ' + sanitizeForLog(err && (err as any).message ? (err as any).message : err));
    process.exit(1);
  }
}

// 直接実行された場合、初期化を実行
if (require.main === module) {
  initializeApiKeySystem();
}
