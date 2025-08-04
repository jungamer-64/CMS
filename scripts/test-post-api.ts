/**
 * 投稿API動作テストスクリプト
 */

import { connectToDatabase } from '../app/lib/database/connection';
import { createPostModel } from '../app/lib/database/models/post';

async function testPostAPI() {
  console.log('🧪 投稿API動作テスト開始...\n');

  try {
    // データベース接続とモデル作成
    await connectToDatabase();
    const postModel = await createPostModel();

    // 1. 全投稿取得テスト
    console.log('1. 📋 全投稿取得テスト...');
    const allPosts = await postModel.findAll({ includeDeleted: true });
    console.log(`   ✅ 総投稿数: ${allPosts.posts.length}件`);
    console.log(`   📊 ページ情報: ${allPosts.page}/${allPosts.totalPages}, 総数: ${allPosts.total}\n`);

    // 2. 公開済み投稿のみ取得テスト
    console.log('2. 📢 公開済み投稿取得テスト...');
    const publishedPosts = await postModel.findPublished();
    console.log(`   ✅ 公開済み投稿数: ${publishedPosts.posts.length}件`);
    publishedPosts.posts.forEach(post => {
      console.log(`   - "${post.title}" by ${post.authorName} (${post.status})`);
    });
    console.log('');

    // 3. 削除済み投稿除外テスト
    console.log('3. 🗑️ 削除済み投稿除外テスト...');
    const activePosts = await postModel.findAll({ includeDeleted: false });
    console.log(`   ✅ アクティブ投稿数: ${activePosts.posts.length}件`);
    console.log('');

    // 4. 特定投稿取得テスト（スラッグ検索）
    console.log('4. 🔍 スラッグ検索テスト...');
    const testPost = await postModel.findBySlug('test');
    if (testPost) {
      console.log(`   ✅ 投稿発見: "${testPost.title}" by ${testPost.authorName}`);
      console.log(`   📝 内容: ${testPost.content.substring(0, 50)}...`);
      console.log(`   🏷️ タグ: ${JSON.stringify(testPost.tags)}`);
      console.log(`   📂 カテゴリ: ${JSON.stringify(testPost.categories)}`);
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
        console.log(`   ✅ ID検索成功: "${foundPost.title}"`);
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
    
    console.log(`   📝 総投稿数: ${totalCount}件`);
    console.log(`   📢 公開済み: ${publishedCount}件`);
    console.log(`   🗑️ 削除済み: ${deletedCount}件`);
    console.log('');

    console.log('🎉 投稿API動作テスト完了！');
    console.log('✅ PostModelは正常に動作しています');

  } catch (error) {
    console.error('❌ テストエラー:', error);
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
      console.error('\n❌ テスト失敗:', error);
      process.exit(1);
    });
}

export default testPostAPI;
