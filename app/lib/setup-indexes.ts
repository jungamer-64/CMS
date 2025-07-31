import { getDatabase, COLLECTIONS } from '@/app/lib/mongodb';

/**
 * APIキーコレクションのインデックスを設定
 */
export async function setupApiKeyIndexes() {
  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.API_KEYS);

    // APIキーでの高速検索のためのインデックス
    await collection.createIndex({ key: 1 }, { unique: true });
    
    // ユーザーIDでの検索用インデックス
    await collection.createIndex({ userId: 1 });
    
    // アクティブなAPIキーの検索用複合インデックス
    await collection.createIndex({ userId: 1, isActive: 1 });
    
    // 期限切れAPIキーのクリーンアップ用インデックス
    await collection.createIndex({ expiresAt: 1 }, { 
      expireAfterSeconds: 0 // TTLインデックス（期限切れのドキュメントを自動削除）
    });

    console.log('APIキーコレクションのインデックス設定が完了しました');
  } catch (error) {
    console.error('APIキーインデックス設定エラー:', error);
    throw error;
  }
}

/**
 * 開発環境での初期化
 */
if (process.env.NODE_ENV === 'development') {
  setupApiKeyIndexes().catch(console.error);
}
