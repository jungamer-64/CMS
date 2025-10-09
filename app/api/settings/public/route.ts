import { handleApiError, handleSuccess, createUnifiedError } from '@/app/lib/core/error-handler';
import { getSettings } from '@/app/lib/settings';

interface PublicSettings {
  enableComments: boolean;
  siteName: string;
  siteDescription: string;
  postsPerPage: number;
}

// パブリック設定を取得（GET）- 認証不要
export async function GET() {
  try {
    console.log('パブリック設定API呼び出し');

    // 管理者設定から公開可能な情報を取得
    const settingsResult = await getSettings();

    if (!settingsResult.success) {
      console.error('設定取得失敗:', settingsResult.error);
      const error = createUnifiedError.internal('設定の取得に失敗しました');
      return handleApiError(error, { location: '/api/settings/public' });
    }

    const adminSettings = settingsResult.data;

    // 型安全なパブリック設定オブジェクトを作成
    const publicSettings: PublicSettings = {
      enableComments: Boolean(adminSettings?.commentsEnabled || false),
      siteName: adminSettings?.siteName || 'テストブログ',
      siteDescription: adminSettings?.siteDescription || 'Next.js 15で構築された動的ブログサイト',
      postsPerPage: 10
    };

    console.log('パブリック設定を返します:', publicSettings);

    return handleSuccess({ settings: publicSettings }, '設定を取得しました');
    
  } catch (err: unknown) {
    console.error('パブリック設定取得エラー:', err instanceof Error ? err : String(err));
    return handleApiError(err, { location: '/api/settings/public' });
  }
}
