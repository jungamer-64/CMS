import { config } from 'dotenv';

// 最初に.env.localファイルを読み込み
config({ path: '.env.local' });

import { userRepository } from '../app/lib/data/repositories/user-repository';

async function listUsers() {
  try {
    console.log('保存されているユーザーデータを確認中...');
    
    const result = await userRepository.findAll({ limit: 100 });
    
    if (result.success) {
      const users = result.data.data;
      console.log(`\n📊 ユーザー数: ${users.length}`);
      console.log('=' .repeat(50));
      
      users.forEach((user, index) => {
        console.log(`\n👤 ユーザー ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  ユーザー名: ${user.username}`);
        console.log(`  表示名: ${user.displayName}`);
        console.log(`  メール: ${user.email}`);
        console.log(`  ロール: ${user.role}`);
        console.log(`  アクティブ: ${user.isActive !== false ? 'はい' : 'いいえ'}`);
        console.log(`  ダークモード: ${user.darkMode ? 'はい' : 'いいえ'}`);
        console.log(`  作成日: ${user.createdAt}`);
        console.log(`  更新日: ${user.updatedAt || '未更新'}`);
        console.log(`  MongoDB _id: ${user._id}`);
      });
      
      console.log('\n💾 保存場所情報:');
      console.log(`  データベース: test-website`);
      console.log(`  コレクション: users`);
      console.log(`  接続先: mongodb://localhost:27017`);
    } else {
      console.error('❌ ユーザーデータの取得に失敗しました:', result.error);
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

listUsers().then(() => process.exit(0));
