import clientPromise from '../app/lib/mongodb';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

// .env.localファイルを読み込み
config({ path: '.env.local' });

async function exportDataToJSON() {
  try {
    console.log('📦 MongoDBデータをJSONファイルにエクスポート中...');
    
    const client = await clientPromise;
    const db = client.db('test-website');
    
    // バックアップディレクトリを作成
    const backupDir = path.join(process.cwd(), 'backup');
    await fs.mkdir(backupDir, { recursive: true });
    
    // 全コレクションを取得
    const collections = await db.listCollections().toArray();
    console.log('📁 コレクション:', collections.map(c => c.name));
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`📤 エクスポート中: ${collectionName}`);
      
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      // JSONファイルに保存
      const filename = path.join(backupDir, `${collectionName}.json`);
      await fs.writeFile(filename, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`   ✅ ${collectionName}: ${documents.length}件 → ${filename}`);
    }
    
    // メタデータも保存
    const metadata = {
      exportDate: new Date().toISOString(),
      database: 'test-website',
      collections: collections.map(c => ({
        name: c.name,
        type: c.type
      }))
    };
    
    await fs.writeFile(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
    
    console.log('✅ データエクスポートが完了しました!');
    console.log(`📁 バックアップ場所: ${backupDir}`);
    
    return true;
  } catch (error) {
    console.error('❌ エクスポート中にエラーが発生しました:', error);
    return false;
  }
}

// 直接実行
if (require.main === module) {
  exportDataToJSON().then(() => process.exit(0));
}

export { exportDataToJSON };
