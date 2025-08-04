/**
 * isDeletedフィールド修正スクリプト
 */

import { connectToDatabase, getDatabase } from '../app/lib/database/connection';

async function fixIsDeletedField() {
  console.log('🔧 isDeletedフィールド修正中...');

  try {
    await connectToDatabase();
    const db = getDatabase();
    const postsCollection = db.collection('posts');

    // isDeletedフィールドが存在しない投稿を修正
    const result = await postsCollection.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );

    console.log(`✅ 修正完了: ${result.modifiedCount}件`);

  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  }
}

if (require.main === module) {
  fixIsDeletedField()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
