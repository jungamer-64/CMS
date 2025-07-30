import { posts } from '../app/lib/placeholder-data';
import { createPost } from '../app/lib/posts';

async function migrateData() {
  console.log('データ移行を開始します...');
  
  try {
    for (const post of posts) {
      console.log(`投稿「${post.title}」を移行中...`);
      await createPost(post);
      console.log(`✓ 投稿「${post.title}」の移行が完了しました`);
    }
    
    console.log('✅ すべてのデータの移行が完了しました！');
  } catch (error) {
    console.error('❌ データ移行中にエラーが発生しました:', error);
  }
}

// 直接実行
migrateData().then(() => process.exit(0));

export { migrateData };
