import { config } from 'dotenv';
config({ path: '.env' });

import { getDatabase } from '../app/lib/mongodb';
import type { ObjectId, Db } from 'mongodb';

// 型定義
interface PostDocument {
  _id: ObjectId;
  id?: string;
  slug?: string;
  content?: string;
  media?: string[];
}

interface MediaDocument {
  _id: ObjectId;
  filename?: string;
  url?: string;
}

interface ConversionResult {
  foundMedia: string[];
  newContent: string;
}

// URLから画像/動画ファイルを抽出する関数
function extractMediaUrls(content: string): string[] {
  const imgSrcs = Array.from(content.matchAll(/<img[^>]+src=["']([^"']+)["']/g)).map(m => m[1]);
  const urlMatches = Array.from(content.matchAll(/(\/uploads\/[\w\-.]+\.(?:png|jpe?g|gif|webp|svg|mp4|webm|mov|avi|m4v|mkv|ogv|3gp|3g2))/gi)).map(m => m[1]);
  return Array.from(new Set([...imgSrcs, ...urlMatches]));
}

// コンテンツ内のURLをファイル名に変換する関数
function convertUrlsToFilenames(
  content: string,
  urls: string[],
  urlToFilename: Map<string, string>
): ConversionResult {
  const foundMedia: string[] = [];
  let newContent = content;
  
  for (const url of urls) {
    const filename = urlToFilename.get(url);
    if (filename && !foundMedia.includes(filename)) {
      foundMedia.push(filename);
      // URL を安全にエスケープして置換
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      newContent = newContent.replace(new RegExp(escapedUrl, 'g'), `/uploads/${filename}`);
    }
  }
  
  return { foundMedia, newContent };
}

// メディアファイルのURLマップを作成する関数
function createUrlToFilenameMap(media: MediaDocument[]): Map<string, string> {
  const urlToFilename = new Map<string, string>();
  
  for (const m of media) {
    if (m.url && m.filename) {
      urlToFilename.set(m.url, m.filename);
      urlToFilename.set(`/uploads/${m.filename}`, m.filename);
    }
  }
  
  return urlToFilename;
}

// 単一の投稿を処理する関数
async function processPost(
  post: PostDocument,
  urlToFilename: Map<string, string>,
  db: Db,
  isDryRun = false
): Promise<boolean> {
  if (!post.content || typeof post.content !== 'string') {
    return false;
  }

  const allUrls = extractMediaUrls(post.content);
  if (allUrls.length === 0) {
    return false;
  }

  const { foundMedia, newContent } = convertUrlsToFilenames(
    post.content,
    allUrls,
    urlToFilename
  );

  if (foundMedia.length > 0) {
    if (!isDryRun) {
      await db.collection('posts').updateOne(
        { _id: post._id },
        { $set: { media: foundMedia, content: newContent } }
      );
    }
    
    const actionText = isDryRun ? 'Would update' : 'Updated';
    console.log(`${actionText} post ${post.slug || post.id}: media=[${foundMedia.join(', ')}]`);
    return true;
  }
  
  return false;
}

async function main(): Promise<void> {
  try {
    // コマンドライン引数からドライランモードを確認
    const isDryRun = process.argv.includes('--dry-run');
    
    const db = await getDatabase();
    const posts = await db.collection('posts').find({}).toArray() as PostDocument[];
    const media = await db.collection('media').find({}).toArray() as MediaDocument[];

    console.log(`投稿数: ${posts.length}, メディア数: ${media.length}`);
    
    if (isDryRun) {
      console.log('🔍 ドライランモード: 実際の更新は行いません');
    }

    const urlToFilename = createUrlToFilenameMap(media);

    let updatedCount = 0;
    for (const post of posts) {
      const wasUpdated = await processPost(post, urlToFilename, db, isDryRun);
      if (wasUpdated) {
        updatedCount++;
      }
    }

    if (isDryRun) {
      console.log(`\nドライラン完了: ${updatedCount}件の投稿が変換対象です。`);
      console.log('実際に変換するには --dry-run オプションを外して実行してください。');
    } else {
      console.log(`\n変換完了: ${updatedCount}件の投稿をmedia参照に変換しました。`);
    }
  } catch (error) {
    console.error('変換処理中にエラーが発生しました:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('スクリプトが正常に完了しました。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプト実行中にエラーが発生しました:', error);
    process.exit(1);
  });
