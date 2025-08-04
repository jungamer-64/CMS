require('dotenv').config();
const { MongoClient } = require('mongodb');

async function updatePostsWithAuthor() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jungamer64:Ib9zZjRzzV9iZU0z@website.maxtfuo.mongodb.net/test-website?retryWrites=true&w=majority&appName=Website';
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test-website');
    const collection = db.collection('posts');
    
    // 全ての投稿を取得
    const posts = await collection.find({}).toArray();
    console.log('Found posts:', posts.length);
    
    // author フィールドが欠落している投稿を更新
    for (const post of posts) {
      console.log('Post:', post.title, 'Author:', post.author, 'AuthorName:', post.authorName);
      
      if (!post.author) {
        const updateResult = await collection.updateOne(
          { _id: post._id },
          { 
            $set: { 
              author: post.authorName || '管理者'
            } 
          }
        );
        console.log(`Updated post: ${post.title}, result:`, updateResult.modifiedCount);
      }
    }
    
    console.log('Author fields updated successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updatePostsWithAuthor();
