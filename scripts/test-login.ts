import { authenticateUser } from '../app/lib/users';
import { config } from 'dotenv';

// .env.localファイルを読み込み
config({ path: '.env.local' });

async function testLogin() {
  try {
    console.log('🔐 ログインテストを実行中...\n');
    
    // 管理者アカウントでテスト
    console.log('👤 管理者アカウント (admin) でテスト:');
    console.log('ユーザー名: admin');
    console.log('テスト用パスワードを入力してください。');
    
    // 実際のパスワードでテスト（ここではサンプル）
    const testPasswords = ['admin', 'password', '123456', 'admin123'];
    
    for (const password of testPasswords) {
      try {
        const user = await authenticateUser('admin', password);
        if (user) {
          console.log(`✅ ログイン成功! パスワード: "${password}"`);
          console.log(`   ユーザー: ${user.username} (${user.email})`);
          console.log(`   役割: ${user.role}`);
          return user;
        }
      } catch (error) {
        // 認証失敗は正常なので、エラーを表示しない
      }
    }
    
    console.log('❌ テストパスワードでのログインに失敗しました');
    console.log('正しいパスワードを確認してください。');
    
    return null;
  } catch (error) {
    console.error('❌ ログインテスト中にエラー:', error);
    return null;
  }
}

// 直接実行
if (require.main === module) {
  testLogin().then(() => process.exit(0));
}

export { testLogin };
