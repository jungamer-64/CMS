import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { revalidateTag, revalidatePath } from 'next/cache';

// キャッシュクリア（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  
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
