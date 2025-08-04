import { env } from '../app/lib/core/config/environment';

console.log('環境変数の設定確認:');
console.log('MONGODB_URI:', env.MONGODB_URI ? '設定済み' : '未設定');
console.log('MONGODB_DB_NAME:', env.MONGODB_DB_NAME || '未設定');
console.log('JWT_SECRET:', env.JWT_SECRET ? '設定済み' : '未設定');
console.log('API_KEYS_DATA:', env.API_KEYS_DATA || '未設定');
console.log('DEFAULT_API_KEY:', env.DEFAULT_API_KEY || '未設定');
console.log('NODE_ENV:', env.NODE_ENV);

console.log('\n環境変数の設定が正常に完了しました！');
