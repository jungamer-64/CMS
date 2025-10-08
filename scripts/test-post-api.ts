/**
 * 投稿API動作テストスクリプト
 */

import { connectToDatabase } from '../app/lib/database/connection';
import { createPostModel } from '../app/lib/database/models/post';

function sanitizeForLog(value: unknown) {
  if (value == null) return '未設定';
  try {
    const s = String(value);
    return s.replace(/[\r\n]+/g, ' ').slice(0, 300);
  } catch {
    return '非表示';
  }
}

async function testPostAPI() {
  console.log('🧪 投稿API動作テスト開始...\n');

  try {
    // データベース接続とモデル作成
    await connectToDatabase();
    const postModel = await createPostModel();

    // 1. 全投稿取得テスト
    console.log('1. 📋 全投稿取得テスト...');
    const allPosts = await postModel.findAll({ includeDeleted: true });
    console.log('   ✅ 総投稿数: ' + sanitizeForLog(allPosts.posts.length) + '件');
    console.log('   📊 ページ情報: ' + sanitizeForLog(allPosts.page) + '/' + sanitizeForLog(allPosts.totalPages) + ', 総数: ' + sanitizeForLog(allPosts.total) + '\n');

    // 2. 公開済み投稿のみ取得テスト
    console.log('2. 📢 公開済み投稿取得テスト...');
    const publishedPosts = await postModel.findPublished();
    console.log('   ✅ 公開済み投稿数: ' + sanitizeForLog(publishedPosts.posts.length) + '件');
    publishedPosts.posts.forEach(post => {
      console.log('   - "' + sanitizeForLog(post.title) + '" by ' + sanitizeForLog(post.authorName) + ' (' + sanitizeForLog(post.status) + ')');
    });
    console.log('');

    // 3. 削除済み投稿除外テスト
    console.log('3. 🗑️ 削除済み投稿除外テスト...');
    const activePosts = await postModel.findAll({ includeDeleted: false });
    console.log('   ✅ アクティブ投稿数: ' + sanitizeForLog(activePosts.posts.length) + '件');
    console.log('');

    // 4. 特定投稿取得テスト（スラッグ検索）
    console.log('4. 🔍 スラッグ検索テスト...');
    const testPost = await postModel.findBySlug('test');
    if (testPost) {
      console.log('   ✅ 投稿発見: "' + sanitizeForLog(testPost.title) + '" by ' + sanitizeForLog(testPost.authorName));
      console.log('   📝 内容: ' + sanitizeForLog((testPost.content || '').toString().substring(0, 50)) + '...');
      console.log('   🏷️ タグ: ' + sanitizeForLog(JSON.stringify(testPost.tags)));
      console.log('   📂 カテゴリ: ' + sanitizeForLog(JSON.stringify(testPost.categories)));
    } else {
      console.log('   ❌ 投稿が見つかりません');
    }
    console.log('');

    // 5. ID検索テスト
    console.log('5. 🆔 ID検索テスト...');
    if (allPosts.posts.length > 0) {
      const firstPost = allPosts.posts[0];
      const foundPost = await postModel.findById(firstPost.id);
      if (foundPost) {
        console.log('   ✅ ID検索成功: "' + sanitizeForLog(foundPost.title) + '"');
      } else {
        console.log('   ❌ ID検索失敗');
      }
    }
    console.log('');

    // 6. 投稿統計テスト
    console.log('6. 📊 投稿統計テスト...');
    const totalCount = await postModel.count();
    const publishedCount = await postModel.count({ status: 'published' });
    const deletedCount = await postModel.count({ includeDeleted: true }) - await postModel.count({ includeDeleted: false });

    console.log('   📝 総投稿数: ' + sanitizeForLog(totalCount) + '件');
    console.log('   📢 公開済み: ' + sanitizeForLog(publishedCount) + '件');
    console.log('   🗑️ 削除済み: ' + sanitizeForLog(deletedCount) + '件');
    console.log('');

    console.log('🎉 投稿API動作テスト完了！');
    console.log('✅ PostModelは正常に動作しています');

  } catch (error) {
    console.error('❌ テストエラー: ' + (error && (error as any).message ? sanitizeForLog((error as any).message) : sanitizeForLog(error)));
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  testPostAPI()
    .then(() => {
      console.log('\n✅ テスト完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ テスト失敗: ' + (error && (error as any).message ? sanitizeForLog((error as any).message) : sanitizeForLog(error)));
      process.exit(1);
    });
}

export default testPostAPI;
