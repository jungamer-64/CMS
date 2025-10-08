/* eslint-env node */
/* global console */
// 直接MongoDBに接続してユーザーを確認
const { MongoClient, ObjectId } = require('mongodb');

// NOTE: this script uses a local connection string for debugging — in CI/production
// prefer using MONGODB_URI from environment or config.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jungamer64:Ib9zZjRzzV9iZU0z@website.maxtfuo.mongodb.net/test-website?retryWrites=true&w=majority&appName=Website";
const MONGODB_DB = process.env.MONGODB_DB || "test-website";

function sanitizeForLog(value) {
  if (value == null) return '未設定';
  const s = String(value);
  // remove CR and LF to avoid log injection
  return s.replace(/[\r\n]+/g, ' ').slice(0, 300);
}

async function checkUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const collection = db.collection('users');

    const users = await collection.find({}).limit(5).toArray();
    console.log('Found ' + sanitizeForLog(users.length) + ' users:');

    for (const [index, user] of users.entries()) {
      console.log('\nUser ' + sanitizeForLog(index + 1) + ':');
      console.log('_id: ' + sanitizeForLog(user._id));
      console.log('id: ' + sanitizeForLog(user.id));
      console.log('username: ' + sanitizeForLog(user.username));
      console.log('role: ' + sanitizeForLog(user.role));
      console.log('All fields: ' + sanitizeForLog(JSON.stringify(Object.keys(user))));
    }

    // 特定のIDでテスト
    const testIds = ['688ea773b0c5731912dcf535', '688ea774b0c5731912dcf536'];

    for (const testId of testIds) {
      console.log('\nSearching for ID: ' + sanitizeForLog(testId));

      // 複数のクエリパターンをテスト
      const queries = [
        { id: testId },
        { _id: testId },
        { username: testId },
        { _id: new ObjectId(testId) }
      ];

      for (const query of queries) {
        const result = await collection.findOne(query);
        console.log('Query: ' + sanitizeForLog(JSON.stringify(query)) + ' - ' + (result ? 'Found' : 'Not found'));
      }
    }

  } catch (error) {
    console.error('Error: ' + sanitizeForLog(error && error.message ? error.message : error));
  } finally {
    await client.close();
  }
}

checkUsers();
