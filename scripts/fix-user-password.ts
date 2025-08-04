import { getDatabase } from '../app/lib/data/connections/mongodb';
import bcrypt from 'bcryptjs';

async function fixUserPassword() {
  try {
    const db = await getDatabase();
    const users = db.collection('users');
    
    // jungamer64ユーザーを検索
    const user = await users.findOne({ username: 'jungamer64' });
    
    if (!user) {
      console.log('❌ ユーザー "jungamer64" が見つかりません');
      return;
    }
    
    console.log('📋 現在のユーザー情報:');
    console.log(`ID: ${user._id}`);
    console.log(`ユーザー名: ${user.username}`);
    console.log(`メール: ${user.email}`);
    console.log(`パスワードハッシュ: ${user.passwordHash ? '設定済み' : '未設定'}`);
    console.log(`パスワードハッシュ長: ${user.passwordHash?.length || 0}`);
    
    if (!user.passwordHash || user.passwordHash.length === 0) {
      console.log('🔧 パスワードハッシュが未設定です。新しいパスワードを設定します...');
      
      // デフォルトパスワード: "password123"
      const defaultPassword = 'password123';
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
      
      // パスワードハッシュを更新
      const result = await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            passwordHash: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ パスワードハッシュが正常に設定されました');
        console.log(`新しいパスワード: ${defaultPassword}`);
        console.log('これでログインができるようになります。');
      } else {
        console.log('❌ パスワードハッシュの更新に失敗しました');
      }
    } else {
      console.log('ℹ️ パスワードハッシュは既に設定されています');
      
      // テスト用パスワードで検証
      const testPassword = 'password123';
      const isValid = await bcrypt.compare(testPassword, user.passwordHash);
      console.log(`パスワード "${testPassword}" の検証結果: ${isValid ? '✅ 正しい' : '❌ 間違っている'}`);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

fixUserPassword().then(() => process.exit(0));
