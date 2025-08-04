/**
 * 投稿データベースマイグレーションスクリプト
 * 既存の投稿データを新しいPostModelスキーマに移行
 */

import { connectToDatabase, getDatabase } from '../app/lib/database/connection';
import { createUserModel } from '../app/lib/database/models/user';

async function migratePostsData() {
  console.log('🔄 投稿データマイグレーション開始...\n');

  try {
    // データベース接続
    await connectToDatabase();
    const db = getDatabase();
    const postsCollection = db.collection('posts');
    const userModel = await createUserModel();

    // 既存投稿取得
    const existingPosts = await postsCollection.find({}).toArray();
    console.log(`📊 移行対象投稿数: ${existingPosts.length}件\n`);

    // ユーザー一覧取得（authorIdマッピング用）
    const users = await userModel.findAll({ limit: 100 });
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user.username, user.id);
      userMap.set(user.displayName, user.id);
    });

    let migratedCount = 0;
    let skippedCount = 0;

    for (const post of existingPosts) {
      try {
        console.log(`📝 移行中: "${post.title}" (ID: ${post.id})`);

        // 新しいスキーマに必要なフィールドを準備
        const updateData: any = {};
        let needsUpdate = false;

        // status フィールド追加（存在しない場合）
        if (!post.status) {
          updateData.status = 'published'; // デフォルトで公開済み
          needsUpdate = true;
          console.log('   ✓ ステータス追加: published');
        }

        // authorName と authorId の処理
        if (post.author && !post.authorName) {
          updateData.authorName = post.author;
          needsUpdate = true;
          console.log(`   ✓ 作成者名設定: ${post.author}`);
        }

        if (!post.authorId && post.author) {
          // ユーザー名から authorId を特定
          const authorId = userMap.get(post.author);
          if (authorId) {
            updateData.authorId = authorId;
            console.log(`   ✓ 作成者ID設定: ${authorId}`);
          } else {
            // 見つからない場合はデフォルトのadminユーザーに設定
            const adminUser = users.find(u => u.role === 'admin');
            updateData.authorId = adminUser?.id || 'unknown';
            console.log(`   ⚠️ 作成者ID不明、管理者に設定: ${updateData.authorId}`);
          }
          needsUpdate = true;
        }

        // tags配列追加（存在しない場合）
        if (!post.tags) {
          updateData.tags = [];
          needsUpdate = true;
          console.log('   ✓ タグ配列追加: []');
        }

        // categories配列追加（存在しない場合）
        if (!post.categories) {
          updateData.categories = [];
          needsUpdate = true;
          console.log('   ✓ カテゴリ配列追加: []');
        }

        // isDeleted フィールド追加（存在しない場合）
        if (post.isDeleted === undefined || post.isDeleted === null) {
          updateData.isDeleted = false;
          needsUpdate = true;
          console.log('   ✓ 削除フラグ追加: false');
        }

        // excerpt がない場合は content から生成
        if (!post.excerpt && post.content) {
          const plainText = post.content.replace(/<[^>]*>/g, '').replace(/[#*`]/g, '');
          updateData.excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
          needsUpdate = true;
          console.log('   ✓ 要約生成完了');
        }

        // publishedAt がない場合は createdAt を使用
        if (!post.publishedAt && (updateData.status === 'published' || post.status === 'published')) {
          updateData.publishedAt = post.createdAt;
          needsUpdate = true;
          console.log('   ✓ 公開日設定: createdAt使用');
        }

        // 更新が必要な場合のみ実行
        if (needsUpdate) {
          const result = await postsCollection.updateOne(
            { _id: post._id },
            { 
              $set: { 
                ...updateData,
                updatedAt: new Date()
              } 
            }
          );

          if (result.modifiedCount > 0) {
            migratedCount++;
            console.log('   ✅ 移行完了\n');
          } else {
            console.log('   ❌ 移行失敗\n');
          }
        } else {
          skippedCount++;
          console.log('   ⏭️ 移行不要（既に最新スキーマ）\n');
        }

      } catch (error) {
        console.error(`   ❌ エラー: ${error}\n`);
      }
    }

    console.log('🎉 投稿データマイグレーション完了！');
    console.log(`✅ 移行完了: ${migratedCount}件`);
    console.log(`⏭️ スキップ: ${skippedCount}件`);
    console.log(`📊 総投稿数: ${existingPosts.length}件\n`);

    // 移行後の確認
    console.log('🔍 移行後データ確認...');
    const migratedPosts = await postsCollection.find({}).toArray();
    const validPosts = migratedPosts.filter(p => p.status && p.authorName && p.tags !== undefined);
    console.log(`✅ 有効な投稿: ${validPosts.length}/${migratedPosts.length}件`);

  } catch (error) {
    console.error('❌ マイグレーションエラー:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  migratePostsData()
    .then(() => {
      console.log('\n✅ マイグレーション完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ マイグレーション失敗:', error);
      process.exit(1);
    });
}

export default migratePostsData;
