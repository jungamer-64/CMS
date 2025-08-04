import { NextResponse } from 'next/server';
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
      return NextResponse.json(
        { success: false, error: '設定の取得に失敗しました' },
        { status: 500 }
      );
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
    
    return NextResponse.json({
      success: true,
      data: { settings: publicSettings }
    });
  } catch (error) {
    console.error('パブリック設定取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '設定の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
