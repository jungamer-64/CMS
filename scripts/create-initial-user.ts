import { createUser } from '../app/lib/users';

async function createInitialUser() {
  try {
    console.log('初期ユーザーを作成中...');
    
    const userData = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      displayName: '管理者'
    };
    
    const user = await createUser(userData);
    console.log('✅ 初期ユーザーが作成されました:');
    console.log(`ユーザー名: ${user.username}`);
    console.log(`表示名: ${user.displayName}`);
    console.log(`メール: ${user.email}`);
    console.log('パスワード: password123');
  } catch (error) {
    if (error instanceof Error && error.message.includes('既に使用されています')) {
      console.log('ℹ️ 初期ユーザーは既に存在します');
    } else {
      console.error('❌ 初期ユーザー作成エラー:', error);
    }
  }
}

createInitialUser().then(() => process.exit(0));
