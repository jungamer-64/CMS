import { getAllPostsSimple } from '../app/lib/posts';

async function checkPosts() {
  try {
    console.log('投稿データを確認中...');
    const posts = await getAllPostsSimple();
    
    console.log('投稿数:', posts.length);
    posts.forEach(post => {
      console.log(`ID: ${post.id}, Slug: ${post.slug}, Title: ${post.title}`);
    });
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkPosts().then(() => process.exit(0));
