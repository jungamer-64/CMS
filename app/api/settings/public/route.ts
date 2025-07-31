import { NextResponse } from 'next/server';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 一時的な設定ストレージ（実際の実装では、データベースまたはファイルシステムを使用）
// この値は admin/settings API と同期する必要があります
let publicSettings = {
  allowComments: true,
  requireApproval: false,
  maintenanceMode: false,
};

export async function GET() {
  try {
    // 管理者設定から必要な設定のみを取得して返す
    // 実際の実装では、データベースから取得する
    console.log('公開設定取得:', publicSettings);
    
    return NextResponse.json({
      success: true,
      settings: publicSettings
    });
  } catch (error) {
    console.error('公開設定取得エラー:', error);
    return NextResponse.json({ 
      success: false, 
      error: '設定の取得に失敗しました',
      // フォールバック設定
      settings: {
        allowComments: true,
        requireApproval: false,
        maintenanceMode: false,
      }
    }, { status: 500 });
  }
}

// 管理者設定更新時に呼び出される内部関数
export function updatePublicSettings(newSettings: {
  allowComments: boolean;
  requireApproval: boolean;
  maintenanceMode: boolean;
}) {
  publicSettings = { ...newSettings };
  console.log('公開設定を更新:', publicSettings);
}
