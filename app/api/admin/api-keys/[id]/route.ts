
import { NextRequest } from 'next/server';
import { withApiAuth, AuthContext } from '@/app/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, validateRequired } from '@/app/lib/api-utils';
import type { ApiKey, ApiKeyPermissions } from '@/app/lib/types';

// URLからidパラメータを安全に抽出
function getIdFromRequest(request: NextRequest): string {
  // /api/admin/api-keys/[id] の [id] 部分を抽出
  const segments = request.nextUrl.pathname.split('/');
  return segments[segments.length - 1] || '';
}

// PUT: APIキー更新用の入力型
type ApiKeyUpdateInput = {
  name: string;
  permissions: ApiKeyPermissions;
  isActive?: boolean;
};

// PATCH: 状態切り替え用の入力型
type ApiKeyPatchInput = {
  isActive: boolean;
};



// APIキーを更新（PUT）
async function putHandler(request: NextRequest, context: AuthContext) {
  const user = context.user;
  const id = getIdFromRequest(request);
  console.log('APIキー更新API呼び出し - ユーザー:', user?.username);
  const body = (await request.json()) as ApiKeyUpdateInput;
  const { name, permissions, isActive } = body;
  console.log('更新データ:', { id, name, permissions, isActive });

  // バリデーション
  const validationError = validateRequired({ name, permissions }, ['name', 'permissions']);
  if (validationError) {
    return createErrorResponse(validationError, 400);
  }
  if (typeof permissions !== 'object' || permissions == null) {
    return createErrorResponse('権限設定は必須です', 400);
  }
  // 厳密な型チェック
  // ここでApiKeyPermissions型の構造チェックを追加しても良い

  // 実際のプロジェクトでは、データベースのAPIキーを更新します
  const updatedApiKey: ApiKey = {
    id,
    userId: user?.id ?? '',
    name: name.trim(),
    key: `ak_test_${Math.random().toString(36).substring(2, 18)}`,
    permissions,
    createdAt: new Date('2024-01-01'),
    lastUsed: new Date(),
    isActive: isActive ?? true
  };
  console.log('APIキー更新成功:', updatedApiKey);
  return createSuccessResponse<ApiKey>(updatedApiKey, 'APIキーが正常に更新されました');
}


// APIキーを削除（DELETE）
async function deleteHandler(request: NextRequest, context: AuthContext) {
  const user = context.user;
  const id = getIdFromRequest(request);
  console.log('APIキー削除API呼び出し - ユーザー:', user?.username);
  console.log('削除対象ID:', id);
  // 実際のプロジェクトでは、データベースからAPIキーを削除します
  console.log('APIキー削除成功');
  return createSuccessResponse<{ id: string }>({ id }, 'APIキーが正常に削除されました');
}


// APIキーの状態を切り替え（PATCH）
async function patchHandler(request: NextRequest, context: AuthContext) {
  const user = context.user;
  const id = getIdFromRequest(request);
  console.log('APIキー状態切り替えAPI呼び出し - ユーザー:', user?.username);
  const body = (await request.json()) as ApiKeyPatchInput;
  const { isActive } = body;
  console.log('状態切り替え:', { id, isActive });
  if (typeof isActive !== 'boolean') {
    return createErrorResponse('isActiveはboolean値である必要があります', 400);
  }
  // 実際のプロジェクトでは、データベースのAPIキー状態を更新します
  console.log('APIキー状態切り替え成功');
  return createSuccessResponse<{ id: string; isActive: boolean }>({ id, isActive }, 'APIキーの状態が正常に更新されました');
}

export const PUT = withApiAuth(putHandler, { resource: 'users', action: 'update' });
export const DELETE = withApiAuth(deleteHandler, { resource: 'users', action: 'delete' });
export const PATCH = withApiAuth(patchHandler, { resource: 'users', action: 'update' });