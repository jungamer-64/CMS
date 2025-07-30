// このスクリプトを使って既存ユーザーを管理者にアップグレードします
// Node.js環境で実行してください

import { getDatabase } from './app/lib/mongodb.js';

async function upgradeUserToAdmin(username) {
  try {
    const db = await getDatabase();
    const result = await db.collection('users').updateOne(
      { username: username },
      { $set: { role: 'admin' } }
    );

    if (result.matchedCount === 0) {
      console.log(`ユーザー "${username}" が見つかりませんでした`);
    } else {
      console.log(`ユーザー "${username}" を管理者にアップグレードしました`);
    }

    // 更新後のユーザー情報を確認
    const user = await db.collection('users').findOne({ username: username });
    console.log('更新後のユーザー情報:', {
      username: user?.username,
      displayName: user?.displayName,
      role: user?.role
    });

  } catch (error) {
    console.error('エラー:', error);
  }
}

// 使用例: 最初に登録したユーザー名を指定してください
upgradeUserToAdmin('testuser'); // ここを実際のユーザー名に変更してください
