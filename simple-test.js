console.log('🚀 テスト開始');

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/posts',
  method: 'GET',
  headers: {
    'X-API-Key': 'api_n1npkrgk6tmdqgfpq3',
    'Content-Type': 'application/json'
  }
};

console.log('📡 APIリクエスト送信中...');

const req = http.request(options, (res) => {
  console.log('📨 レスポンス受信:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('✅ API接続成功！記事数:', parsed.posts ? parsed.posts.length : 0);
    } catch (error) {
      console.log('❌ JSON解析エラー:', error.message);
      console.log('生データ:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ リクエストエラー:', error.message);
});

req.end();

console.log('⌛ リクエスト送信完了、レスポンス待機中...');
