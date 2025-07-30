import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/app/lib/users';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

interface Settings {
  darkMode: boolean;
  apiAccess: boolean;
  apiKey: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  maxPostsPerPage: number;
  allowComments: boolean;
  requireApproval: boolean;
}

// デフォルト設定
const defaultSettings: Settings = {
  darkMode: false,
  apiAccess: true,
  apiKey: '',
  emailNotifications: true,
  maintenanceMode: false,
  maxPostsPerPage: 10,
  allowComments: true,
  requireApproval: false,
};

// 一時的な設定ストレージ（実際の実装では、データベースまたはファイルシステムを使用）
let currentSettings: Settings = { ...defaultSettings };

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    throw new Error('認証が必要です');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const user = await getUserById(decoded.userId);
  
  if (!user || user.role !== 'admin') {
    throw new Error('管理者権限が必要です');
  }
  
  return user;
}

export async function GET(request: NextRequest) {
  try {
    console.log('設定取得API呼び出し');
    const user = await requireAdmin(request);
    console.log('認証成功:', user.id);
    
    // 現在の設定を返す
    console.log('Returning settings:', currentSettings);
    return NextResponse.json(currentSettings);
  } catch (error) {
    console.error('設定取得エラー:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : '設定の取得に失敗しました' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('設定保存API呼び出し');
    const user = await requireAdmin(request);
    const settings: Settings = await request.json();
    console.log('受信した設定:', settings);

    // 入力値の検証
    if (typeof settings.maxPostsPerPage !== 'number' || settings.maxPostsPerPage < 5 || settings.maxPostsPerPage > 50) {
      return NextResponse.json({ error: 'ページあたりの投稿数は5-50の範囲で指定してください' }, { status: 400 });
    }

    console.log('認証成功、設定を保存:', user.id);
    
    // 設定をメモリに保存
    currentSettings = { ...settings };
    console.log('設定を保存しました:', currentSettings);
    
    console.log('保存完了');
    return NextResponse.json({ message: '設定が正常に保存されました' });
  } catch (error) {
    console.error('設定保存エラー:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : '設定の保存に失敗しました' }, { status: 401 });
  }
}
