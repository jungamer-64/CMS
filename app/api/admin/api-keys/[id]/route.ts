import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/app/lib/users';
import fs from 'fs';
import path from 'path';
import { ApiKey } from '@/app/lib/api-keys';

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
  } catch {
    return null;
  }
}

// APIキーを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 管理者認証
    const user = await authenticateAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions, isActive } = body;

    // 名前が提供されている場合のみバリデーション（状態変更のみの場合はスキップ）
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'APIキー名は必須です' },
        { status: 400 }
      );
    }

    const apiKeys = loadApiKeys();
    const keyIndex = apiKeys.findIndex(key => key.id === id);

    if (keyIndex === -1) {
      return NextResponse.json(
        { error: 'APIキーが見つかりません' },
        { status: 404 }
      );
    }

    // 同じ名前の別のキーが存在するかチェック（名前が提供されている場合のみ）
    if (name !== undefined) {
      const duplicateKey = apiKeys.find(key => key.name === name.trim() && key.id !== id);
      if (duplicateKey) {
        return NextResponse.json(
          { error: 'この名前のAPIキーは既に存在します' },
          { status: 400 }
        );
      }
    }

    // APIキーを更新
    apiKeys[keyIndex] = {
      ...apiKeys[keyIndex],
      name: name !== undefined ? name.trim() : apiKeys[keyIndex].name,
      permissions: permissions || apiKeys[keyIndex].permissions,
      isActive: isActive !== undefined ? isActive : apiKeys[keyIndex].isActive
    };

    saveApiKeys(apiKeys);

    return NextResponse.json({
      success: true,
      message: 'APIキーが正常に更新されました',
      apiKey: {
        ...apiKeys[keyIndex],
        key: `${apiKeys[keyIndex].key.substring(0, 4)}****${apiKeys[keyIndex].key.substring(apiKeys[keyIndex].key.length - 4)}`
      }
    });
  } catch (error) {
    console.error('APIキー更新エラー:', error);
    return NextResponse.json(
      { error: 'APIキーの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// APIキーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 管理者認証
    const user = await authenticateAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      );
    }

    const apiKeys = loadApiKeys();
    const keyIndex = apiKeys.findIndex(key => key.id === id);

    if (keyIndex === -1) {
      return NextResponse.json(
        { error: 'APIキーが見つかりません' },
        { status: 404 }
      );
    }

    // APIキーを削除
    const deletedKey = apiKeys.splice(keyIndex, 1)[0];
    saveApiKeys(apiKeys);

    return NextResponse.json({
      success: true,
      message: 'APIキーが正常に削除されました',
      deletedKey: {
        id: deletedKey.id,
        name: deletedKey.name
      }
    });
  } catch (error) {
    console.error('APIキー削除エラー:', error);
    return NextResponse.json(
      { error: 'APIキーの削除に失敗しました' },
      { status: 500 }
    );
  }
}
