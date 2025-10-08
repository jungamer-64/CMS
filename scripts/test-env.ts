import { env } from '../app/lib/core/config/environment';

function sanitizeForLog(value: unknown) {
    if (value == null) return '';
    try { return String(value).replace(/\r?\n|[\u0000-\u001F\u007F]/g, ' ').slice(0, 300); } catch { return String(value); }
}

console.log('環境変数の設定確認:');
console.log('MONGODB_URI: ' + sanitizeForLog(env.MONGODB_URI ? '設定済み' : '未設定'));
console.log('MONGODB_DB_NAME: ' + sanitizeForLog(env.MONGODB_DB_NAME || '未設定'));
console.log('JWT_SECRET: ' + sanitizeForLog(env.JWT_SECRET ? '設定済み' : '未設定'));
console.log('API_KEYS_DATA: ' + sanitizeForLog(env.API_KEYS_DATA || '未設定'));
console.log('DEFAULT_API_KEY: ' + sanitizeForLog(env.DEFAULT_API_KEY || '未設定'));
console.log('NODE_ENV: ' + sanitizeForLog(env.NODE_ENV));

console.log('\n環境変数の設定が正常に完了しました！');
