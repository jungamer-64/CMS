import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// .env.localファイルを読み込み
config({ path: '.env.local' });

async function resetPasswordDirect() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI環境変数が設定されていません');
      return false;
    }
    
    console.log('🔧 Atlas直接接続でパスワードリセット中...');
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('test-website');
    const collection = db.collection('users');
    
    // 管理者アカウントのパスワードを'admin123'に設定
    const newPassword = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await collection.updateOne(
      { username: 'admin' },
      { 
        $set: { 
          passwordHash,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ 管理者アカウントのパスワードをリセットしました');
      console.log('   ユーザー名: admin');
      console.log('   新しいパスワード: admin123');
    } else {
      console.log('❌ 管理者アカウントのパスワードリセットに失敗しました');
    }
    
    // jungamer64アカウントのパスワードも設定
    const userPassword = 'password123';
    const userPasswordHash = await bcrypt.hash(userPassword, saltRounds);
    
    const userResult = await collection.updateOne(
      { username: 'jungamer64' },
      { 
        $set: { 
          passwordHash: userPasswordHash,
          updatedAt: new Date()
        }
      }
    );
    
    if (userResult.modifiedCount > 0) {
      console.log('✅ jungamer64アカウントのパスワードをリセットしました');
      console.log('   ユーザー名: jungamer64');
      console.log('   新しいパスワード: password123');
    }
    
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ パスワードリセット中にエラー:', error);
    return false;
  }
}

// 直接実行
if (require.main === module) {
  resetPasswordDirect().then(() => process.exit(0));
}

export { resetPasswordDirect };
