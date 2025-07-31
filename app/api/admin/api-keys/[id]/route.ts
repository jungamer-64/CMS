import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse, validateRequired, getParams } from '@/app/lib/api-utils';

// APIキーを更新（PUT）
export const PUT = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  console.log('APIキー更新API呼び出し - ユーザー:', user.username);
  
  const { id } = await getParams(params);
  const { name, permissions, isActive } = await request.json();
  
  console.log('更新データ:', { id, name, permissions, isActive });

  // バリデーション
  const validationError = validateRequired({ name, permissions }, ['name', 'permissions']);
  if (validationError) {
    return createErrorResponse(validationError, 400);
  }

  if (typeof permissions !== 'object') {
    return createErrorResponse('権限設定は必須です', 400);
  }

  // 実際のプロジェクトでは、データベースのAPIキーを更新します
  const updatedApiKey = {
    id,
    name: name.trim(),
    key: `ak_test_${Math.random().toString(36).substring(2, 18)}`, // 実際は既存のキーを保持
    permissions,
    createdAt: new Date('2024-01-01').toISOString(), // 実際は既存の作成日を保持
    lastUsed: new Date().toISOString(),
    isActive: isActive !== undefined ? isActive : true
  };

  console.log('APIキー更新成功:', updatedApiKey);
  
  return createSuccessResponse(updatedApiKey, 'APIキーが正常に更新されました');
});

// APIキーを削除（DELETE）
export const DELETE = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  console.log('APIキー削除API呼び出し - ユーザー:', user.username);
  
  const { id } = await getParams(params);
  console.log('削除対象ID:', id);

  // 実際のプロジェクトでは、データベースからAPIキーを削除します
  console.log('APIキー削除成功');
  
  return createSuccessResponse({ id }, 'APIキーが正常に削除されました');
});

// APIキーの状態を切り替え（PATCH）
export const PATCH = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  console.log('APIキー状態切り替えAPI呼び出し - ユーザー:', user.username);
  
  const { id } = await getParams(params);
  const { isActive } = await request.json();
  
  console.log('状態切り替え:', { id, isActive });

  if (typeof isActive !== 'boolean') {
    return createErrorResponse('isActiveはboolean値である必要があります', 400);
  }

  // 実際のプロジェクトでは、データベースのAPIキー状態を更新します
  console.log('APIキー状態切り替え成功');
  
  return createSuccessResponse({ id, isActive }, 'APIキーの状態が正常に更新されました');
});