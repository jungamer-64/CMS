// 直接MongoDBに接続してユーザーを確認
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = "mongodb+srv://jungamer64:Ib9zZjRzzV9iZU0z@website.maxtfuo.mongodb.net/test-website?retryWrites=true&w=majority&appName=Website";
const MONGODB_DB = "test-website";

async function checkUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('users');
    
    const users = await collection.find({}).limit(5).toArray();
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('_id:', user._id);
      console.log('id:', user.id);
      console.log('username:', user.username);
      console.log('role:', user.role);
      console.log('All fields:', Object.keys(user));
    });
    
    // 特定のIDでテスト
    const testIds = ['688ea773b0c5731912dcf535', '688ea774b0c5731912dcf536'];
    
    for (const testId of testIds) {
      console.log(`\nSearching for ID: ${testId}`);
      
      // 複数のクエリパターンをテスト
      const queries = [
        { id: testId },
        { _id: testId },
        { username: testId },
        { _id: new ObjectId(testId) }
      ];
      
      for (const query of queries) {
        const result = await collection.findOne(query);
        console.log(`Query ${JSON.stringify(query)}:`, result ? 'Found' : 'Not found');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();
