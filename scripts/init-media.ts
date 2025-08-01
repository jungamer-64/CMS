// 初期メディアデータをMongoDBに登録するスクリプト
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// 環境変数を読み込み（プロジェクトルートの.envファイルを指定）
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

// 環境変数の型定義
interface EnvConfig {
  MONGODB_URI: string;
  MONGODB_DB: string;
}

// メディアアイテムの型定義
interface MediaItem {
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  url: string;
  mediaType: 'image' | 'video' | 'other';
  directory: string;
}

// 環境変数の取得と検証
function getEnvConfig(): EnvConfig {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri || !dbName) {
    console.error('MONGODB_URI または MONGODB_DB が .env に設定されていません');
    console.error('プロジェクトルートに .env ファイルが存在することを確認してください');
    process.exit(1);
  }

  return {
    MONGODB_URI: uri,
    MONGODB_DB: dbName
  };
}

const config = getEnvConfig();
const uploadsDir = path.join(projectRoot, 'public', 'uploads');
const imageExtensions: readonly string[] = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const videoExtensions: readonly string[] = ['.mp4', '.webm', '.mov', '.avi', '.m4v', '.mkv', '.ogv', '.3gp', '.3g2'];

// メディアタイプを判定する関数
function getMediaType(extension: string): 'image' | 'video' | 'other' {
  const ext = extension.toLowerCase();
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  return 'other';
}

// ファイル名から元の名前を抽出する関数
function extractOriginalName(filename: string): string {
  return filename.replace(/^\d+-/, '');
}

// パスを正規化する関数（Windowsのバックスラッシュをスラッシュに変換）
function normalizePath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/');
}

// ディレクトリを再帰的に走査してメディアファイルを収集する関数
function walk(dir: string, relDir: string = ''): MediaItem[] {
  let results: MediaItem[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      const entryRelPath = path.join(relDir, entry.name);
      
      if (entry.isDirectory()) {
        // ディレクトリの場合は再帰的に処理
        results = results.concat(walk(entryPath, entryRelPath));
      } else {
        // ファイルの場合はメディアファイルかチェック
        const ext = path.extname(entry.name).toLowerCase();
        const mediaType = getMediaType(ext);
        
        if (mediaType !== 'other') {
          try {
            const stats = fs.statSync(entryPath);
            const originalName = extractOriginalName(entry.name);
            const normalizedRelPath = normalizePath(entryRelPath);
            const directory = path.dirname(`/uploads/${normalizedRelPath}`);
            
            const mediaItem: MediaItem = {
              filename: entry.name,
              originalName,
              size: stats.size,
              uploadDate: stats.birthtime.toISOString(),
              url: `/uploads/${normalizedRelPath}`,
              mediaType,
              directory
            };
            
            results.push(mediaItem);
          } catch (error) {
            console.warn(`ファイル情報の取得に失敗しました: ${entryPath}`, error);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`ディレクトリの読み取りに失敗しました: ${dir}`, error);
  }
  
  return results;
}

// メイン処理
async function main(): Promise<void> {
  const client = new MongoClient(config.MONGODB_URI);
  
  try {
    console.log('MongoDBに接続しています...');
    await client.connect();
    
    const db = client.db(config.MONGODB_DB);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('アップロードディレクトリが存在しません。作成します...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    console.log('メディアファイルを検索しています...');
    const media = walk(uploadsDir);
    
    if (!media.length) {
      console.log('登録するメディアファイルがありません');
      return;
    }
    
    console.log(`${media.length}件のメディアファイルが見つかりました`);
    
    // 既存のメディアデータを削除
    console.log('既存のメディアデータを削除しています...');
    const deleteResult = await db.collection('media').deleteMany({});
    console.log(`${deleteResult.deletedCount}件の既存データを削除しました`);
    
    // 新しいメディアデータを挿入
    console.log('新しいメディアデータを挿入しています...');
    const insertResult = await db.collection('media').insertMany(media);
    console.log(`${insertResult.insertedCount}件のメディアをmediaコレクションに登録しました`);
    
    // 登録されたファイルの詳細を表示
    console.log('\n登録されたファイル:');
    media.forEach((item, index) => {
      console.log(`${index + 1}. ${item.filename} (${item.mediaType}, ${item.size} bytes)`);
    });
    
  } catch (error) {
    console.error('初期化エラー:', error);
    process.exit(1);
  } finally {
    console.log('MongoDBとの接続を閉じています...');
    await client.close();
  }
}

// 未処理の例外をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise拒否:', promise, 'reason:', reason);
  process.exit(1);
});

// スクリプトの実行
if (require.main === module) {
  main().catch((error) => {
    console.error('スクリプト実行エラー:', error);
    process.exit(1);
  });
}
