import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

// .env.localファイルを読み込み
config({ path: '.env.local' });

async function importDataFromJSON() {
  try {
    const atlasUri = process.env.MONGODB_ATLAS_URI;
    
    if (!atlasUri) {
      console.error('❌ MONGODB_ATLAS_URI環境変数が設定されていません');
      console.log('例: mongodb+srv://username:password@cluster.mongodb.net/test-website');
      return false;
    }
    
    console.log('📤 MongoDB AtlasにJSONデータをインポート中...');
    
    const client = new MongoClient(atlasUri);
    await client.connect();
    
    const db = client.db('test-website');
    const backupDir = path.join(process.cwd(), 'backup');
    
    // メタデータを読み込み
    const metadataPath = path.join(backupDir, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);
    
    console.log(`📊 インポート開始: ${metadata.exportDate} のバックアップ`);
    
    for (const collectionInfo of metadata.collections) {
      const collectionName = collectionInfo.name;
      console.log(`📥 インポート中: ${collectionName}`);
      
      // JSONファイルを読み込み
      const filename = path.join(backupDir, `${collectionName}.json`);
      const jsonContent = await fs.readFile(filename, 'utf8');
      const documents = JSON.parse(jsonContent);
      
      if (documents.length === 0) {
        console.log(`   ⚠️  ${collectionName}: データなし`);
        continue;
      }
      
      // コレクションをクリアして挿入
      const collection = db.collection(collectionName);
      await collection.deleteMany({});
      
      const result = await collection.insertMany(documents);
      console.log(`   ✅ ${collectionName}: ${result.insertedCount}件をインポート`);
    }
    
    await client.close();
    
    console.log('✅ Atlas復元が完了しました!');
    return true;
  } catch (error) {
    console.error('❌ Atlas復元中にエラーが発生しました:', error);
    return false;
  }
}

// 直接実行
if (require.main === module) {
  importDataFromJSON().then(() => process.exit(0));
}

export { importDataFromJSON };
