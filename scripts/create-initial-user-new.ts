import { UserRepository } from '../app/lib/data/repositories/user-repository';

async function createInitialUsers() {
  try {
    console.log('初期ユーザーを作成中...');
    
    const userRepository = new UserRepository();
    
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        displayName: '管理者',
        role: 'admin' as const
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: 'user123',
        displayName: 'テストユーザー',
        role: 'user' as const
      },
      {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'テストアカウント',
        role: 'user' as const
      }
    ];

    for (const userData of testUsers) {
      try {
        const result = await userRepository.create(userData);
        if (result.success) {
          console.log(`✅ ユーザー作成成功: ${userData.username}`);
          console.log(`   表示名: ${userData.displayName}`);
          console.log(`   メール: ${userData.email}`);
          console.log(`   パスワード: ${userData.password}`);
        } else {
          if (result.error?.includes('既に存在します') || result.error?.includes('already exists')) {
            console.log(`ℹ️ ユーザー既存: ${userData.username}`);
          } else {
            console.error(`❌ ユーザー作成エラー (${userData.username}):`, result.error);
          }
        }
      } catch (error) {
        console.error(`❌ ユーザー作成例外 (${userData.username}):`, error);
      }
    }
    
    console.log('\n=== 初期ユーザー作成完了 ===');
    console.log('利用可能なアカウント:');
    console.log('1. admin / admin123 (管理者)');
    console.log('2. user / user123 (一般ユーザー)');
    console.log('3. test / password123 (テストユーザー)');
    
  } catch (error) {
    console.error('❌ 初期ユーザー作成プロセスエラー:', error);
  }
}

createInitialUsers().then(() => {
  console.log('初期ユーザー作成プロセス完了');
  process.exit(0);
}).catch((error) => {
  console.error('❌ プロセス実行エラー:', error);
  process.exit(1);
});
