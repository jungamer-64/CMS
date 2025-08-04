// 環境変数確認用の簡単なスクリプト
console.log('🔍 環境変数チェック:');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '設定済み' : '未設定'}`);
console.log(`MONGODB_DB: ${process.env.MONGODB_DB || '未設定'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '設定済み' : '未設定'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || '未設定'}`);
