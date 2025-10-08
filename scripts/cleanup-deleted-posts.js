/* eslint-env node */

// 削除済み投稿をデータベースから完全に削除するスクリプト

// Load environment variables from .env.local using dotenv (optional)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv optional in some environments
}

let MongoClient;
try {
  // dynamic require to avoid bundlers trying to resolve at build-time
  const mongodbModule = require('mongo' + 'db');
  MongoClient = mongodbModule.MongoClient;
} catch (err) {
  // sanitizeForLog は下で定義しているため、ここでは簡潔にメッセージを表示
  console.error("The 'mongodb' package is not installed or could not be resolved. Install it with 'pnpm add mongodb' or 'npm install mongodb'. Error: " + (err && err.message ? String(err.message) : String(err)));
  process.exit(1);
}

function sanitizeForLog(value) {
  try {
    if (value === undefined || value === null) return '未設定';
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    const noNewline = s.replace(/\r\n|\r|\n/g, ' ');
    const cleaned = Array.from(noNewline)
      .map((ch) => {
        const code = ch.charCodeAt(0);
        return (code >= 0 && code <= 31) || code === 127 ? ' ' : ch;
      })
      .join('');
    return cleaned.slice(0, 300);
  } catch (e) {
    return String(value);
  }
}

async function cleanupDeletedPosts() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI環境変数が設定されていません');
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('MongoDB接続成功');

    const db = client.db();

    // 削除済み投稿を確認
    const deletedPosts = await db.collection('posts').find({ isDeleted: true }).toArray();
    console.log('削除済み投稿数: ' + sanitizeForLog(deletedPosts.length));

    if (deletedPosts.length > 0) {
      console.log('\n削除済み投稿:');
      for (const [index, post] of deletedPosts.entries()) {
        console.log((index + 1) + '. タイトル: ' + sanitizeForLog(post.title) + ' (ID: ' + sanitizeForLog(post._id) + ')');
      }

      // 削除済み投稿を完全に削除
      const result = await db.collection('posts').deleteMany({ isDeleted: true });
      console.log(sanitizeForLog(result.deletedCount) + '件の削除済み投稿を完全に削除しました');
    } else {
      console.log('削除済み投稿はありません');
    }

    // 残った投稿を確認
    const remainingPosts = await db.collection('posts').find({}).toArray();
    console.log('\n残った投稿数: ' + sanitizeForLog(remainingPosts.length));

  } catch (error) {
    console.error('エラー: ' + (error && error.message ? sanitizeForLog(error.message) : sanitizeForLog(error)));
  } finally {
    try {
      await client.close();
    } catch (e) {
      // ignore close errors
    }
  }
}

cleanupDeletedPosts();
