const https = require('https');
const http = require('http');

function testAPI() {
  return new Promise((resolve, reject) => {
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

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('ステータスコード:', res.statusCode);
        console.log('ヘッダー:', res.headers);
        console.log('レスポンス:', data);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('エラー:', error);
      reject(error);
    });

    req.end();
  });
}

// API投稿テスト
function testCreatePost() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      title: "APIテスト記事",
      content: "これはAPIから作成されたテスト記事です。",
      excerpt: "APIテスト",
      status: "published"
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/posts',
      method: 'POST',
      headers: {
        'X-API-Key': 'api_n1npkrgk6tmdqgfpq3',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\n=== POST テスト ===');
        console.log('ステータスコード:', res.statusCode);
        console.log('レスポンス:', data);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('POST エラー:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

console.log('🚀 APIテスト開始');
console.log('=== GET テスト ===');
testAPI()
  .then(() => testCreatePost())
  .then(() => {
    console.log('✅ APIテスト完了');
  })
  .catch(error => {
    console.error('❌ APIテストエラー:', error);
  });
