import { getAllPosts } from '../app/lib/posts';

async function checkPosts() {
  try {
    console.log('投稿データを確認中...');
    const posts = await getAllPosts();
    
    console.log('投稿数:', posts.length);
    posts.forEach(post => {
      console.log(`ID: ${post.id}, Slug: ${post.slug}, Title: ${post.title}`);
    });
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkPosts().then(() => process.exit(0));
