import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { revalidateTag, revalidatePath } from 'next/cache';

// キャッシュクリア（DELETE）
export const DELETE = withAuth(async (request: NextRequest, user) => {
  console.log('キャッシュクリアAPI呼び出し - ユーザー:', user.username);
  
  try {
    // Next.jsのキャッシュをクリア
    
    // 特定のタグでキャッシュされたデータをクリア
    revalidateTag('posts');
    revalidateTag('comments');
    revalidateTag('settings');
    revalidateTag('users');
    revalidateTag('api-keys');
    
    // 特定のパスのキャッシュをクリア
    revalidatePath('/');
    revalidatePath('/blog');
    revalidatePath('/posts');
    revalidatePath('/admin');
    revalidatePath('/admin/posts');
    revalidatePath('/admin/comments');
    revalidatePath('/admin/users');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/api-keys');
    
    // APIルートのキャッシュもクリア
    revalidatePath('/api/posts');
    revalidatePath('/api/comments');
    revalidatePath('/api/admin/posts');
    revalidatePath('/api/admin/comments');
    revalidatePath('/api/admin/users');
    revalidatePath('/api/admin/settings');
    
    console.log('キャッシュクリアが完了しました');
    
    return createSuccessResponse({}, 'キャッシュがクリアされました');
  } catch (error) {
    console.error('キャッシュクリアエラー:', error);
    return createErrorResponse('キャッシュクリア中にエラーが発生しました', 500);
  }
});
