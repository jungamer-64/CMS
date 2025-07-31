import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/app/lib/users';
import fs from 'fs';
import path from 'path';
import { ApiKey, ApiKeyInput, defaultPermissions } from '@/app/lib/api-keys';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// APIキー管理ファイルのパス
const apiKeysPath = path.join(process.cwd(), 'data', 'api-keys.json');

// APIキーを読み込む
function loadApiKeys(): ApiKey[] {
  try {
    if (fs.existsSync(apiKeysPath)) {
      const data = fs.readFileSync(apiKeysPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('APIキー読み込みエラー:', error);
  }
  return [];
}

// APIキーを保存する
function saveApiKeys(apiKeys: ApiKey[]): void {
  try {
    const dir = path.dirname(apiKeysPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(apiKeysPath, JSON.stringify(apiKeys, null, 2));
  } catch (error) {
    console.error('APIキー保存エラー:', error);
    throw new Error('APIキーの保存に失敗しました');
  }
}

// 管理者認証
async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    const user = await getUserById(decoded.userId);
    return user?.role === 'admin' ? user : null;
  } catch (error) {
    console.log('authenticateAdmin: token verification failed', error);
    return null;
  }
}

// APIキー一覧を取得
export async function GET(request: NextRequest) {
  try {
    console.log('API Key list request received');
    
    // 管理者認証
    const user = await authenticateAdmin(request);
    console.log('Authenticated user for GET:', user);
    
    if (!user) {
      console.log('GET Authentication failed - no user or not admin');
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      );
    }

    const apiKeys = loadApiKeys();
    
    // セキュリティのため、keyの値は最初の4文字と最後の4文字のみ表示
    const safeApiKeys = apiKeys.map(key => ({
      ...key,
      key: `${key.key.substring(0, 4)}****${key.key.substring(key.key.length - 4)}`
    }));

    return NextResponse.json({
      success: true,
      apiKeys: safeApiKeys
    });
  } catch (error) {
    console.error('APIキー一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'APIキーの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しいAPIキーを作成
export async function POST(request: NextRequest) {
  try {
    console.log('API Key creation request received');
    
    // 管理者認証
    const user = await authenticateAdmin(request);
    console.log('Authenticated user:', user);
    
    if (!user) {
      console.log('Authentication failed - no user or not admin');
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions = defaultPermissions } = body as ApiKeyInput;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'APIキー名は必須です' },
        { status: 400 }
      );
    }

    const apiKeys = loadApiKeys();

    // 同じ名前のキーが存在するかチェック
    if (apiKeys.some(key => key.name === name.trim())) {
      return NextResponse.json(
        { error: 'この名前のAPIキーは既に存在します' },
        { status: 400 }
      );
    }

    // 新しいAPIキーを生成
    const id = Date.now().toString();
    const key = `api_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    
    const newApiKey: ApiKey = {
      id,
      name: name.trim(),
      key,
      permissions,
      createdAt: new Date(),
      isActive: true
    };

    apiKeys.push(newApiKey);
    saveApiKeys(apiKeys);

    return NextResponse.json({
      success: true,
      message: 'APIキーが正常に作成されました',
      apiKey: {
        ...newApiKey,
        key // 作成時のみ完全なキーを返す
      }
    }, { status: 201 });
  } catch (error) {
    console.error('APIキー作成エラー:', error);
    return NextResponse.json(
      { error: 'APIキーの作成に失敗しました' },
      { status: 500 }
    );
  }
}
