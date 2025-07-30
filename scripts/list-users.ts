import { getUsersCollection } from '../app/lib/users';
import { config } from 'dotenv';

// .env.localファイルを読み込み
config({ path: '.env.local' });

async function listUsers() {
  try {
    console.log('保存されているユーザーデータを確認中...');
    const collection = await getUsersCollection();
    const users = await collection.find({}).toArray();
    
    console.log(`\n📊 ユーザー数: ${users.length}`);
    console.log('=' .repeat(50));
    
    users.forEach((user, index) => {
      console.log(`\n👤 ユーザー ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  ユーザー名: ${user.username}`);
      console.log(`  表示名: ${user.displayName}`);
      console.log(`  メール: ${user.email}`);
      console.log(`  作成日: ${user.createdAt.toLocaleString()}`);
      console.log(`  MongoDB _id: ${user._id}`);
    });
    
    console.log('\n💾 保存場所情報:');
    console.log(`  データベース: test-website`);
    console.log(`  コレクション: users`);
    console.log(`  接続先: mongodb://localhost:27017`);
    
  } catch (error) {
    console.error('❌ ユーザーデータ取得エラー:', error);
  }
}

listUsers().then(() => process.exit(0));
