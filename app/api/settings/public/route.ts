import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { getSettings } from '@/app/lib/settings';

// パブリック設定を取得（GET）- 認証不要
export async function GET() {
  console.log('パブリック設定API呼び出し');
  
  try {
    // 管理者設定から公開可能な情報を取得
    const adminSettings = await getSettings();
    
    // 管理者設定から公開可能な情報のみを抽出
    const publicSettings = {
      allowComments: adminSettings.allowComments,
      requireApproval: adminSettings.requireApproval,
      siteName: 'テストブログ',
      siteDescription: 'Next.js 15で構築された動的ブログサイト',
      maxCommentLength: 1000,
      commentsPerPage: 10,
      maxPostsPerPage: adminSettings.maxPostsPerPage
    };

    console.log('パブリック設定を返します:', publicSettings);
    
    return createSuccessResponse(
      { settings: publicSettings }, 
      'パブリック設定を正常に取得しました'
    );
  } catch (error) {
    console.error('パブリック設定取得エラー:', error);
    return createErrorResponse('設定の取得中にエラーが発生しました', 500);
  }
}
