import { NextRequest } from 'next/server';
import { getUserById, updateUser, deleteUser } from '@/app/lib/users';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { UserUpdateInput } from '@/app/lib/types';

// URLからIDを抽出するヘルパー関数
function extractIdFromUrl(url: string): string {
  const pathSegments = url.split('/');
  return pathSegments[pathSegments.length - 1];
}

// 型ガード関数
function isUserUpdateRequest(obj: unknown): obj is UserUpdateInput {
  if (!obj || typeof obj !== 'object') return false;
  // UserUpdateInputの基本的な構造チェック
  return true; // 詳細なバリデーションはupdateUser関数内で行う
}

// 特定ユーザー情報を取得（GET）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const id = extractIdFromUrl(request.url);

    if (!id) {
      return createErrorResponse('ユーザーIDが必要です', 400);
    }

    const targetUser = await getUserById(id);
    if (!targetUser) {
      return createErrorResponse('ユーザーが見つかりません', 404);
    }

    // パスワードハッシュを除外してレスポンス
    const safeUser = {
      id: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      displayName: targetUser.displayName,
      role: targetUser.role,
      darkMode: targetUser.darkMode,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt
    };

    return createSuccessResponse(safeUser, 'ユーザー情報を取得しました');
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return createErrorResponse('ユーザー情報の取得に失敗しました', 500);
  }
});

// ユーザー情報を更新（PUT）
export const PUT = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const id = extractIdFromUrl(request.url);

    if (!id) {
      return createErrorResponse('ユーザーIDが必要です', 400);
    }

    const body: unknown = await request.json();
    
    // 型ガードによる検証
    if (!isUserUpdateRequest(body)) {
      return createErrorResponse('無効なリクエストデータです', 400);
    }

    const updateData = body;

    // 自分自身の役割変更を防ぐ
    if (id === user.id && updateData.role && updateData.role !== user.role) {
      return createErrorResponse('自分自身の役割は変更できません', 403);
    }
    
    const success = await updateUser(id, updateData);
    if (!success) {
      return createErrorResponse('ユーザーの更新に失敗しました', 400);
    }

    // 更新されたユーザー情報を取得
    const updatedUser = await getUserById(id);
    if (!updatedUser) {
      return createErrorResponse('更新されたユーザー情報の取得に失敗しました', 500);
    }

    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      role: updatedUser.role,
      darkMode: updatedUser.darkMode,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    console.log('ユーザー更新成功 - ID:', id);
    return createSuccessResponse(safeUser, 'ユーザーが正常に更新されました');
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'ユーザーの更新に失敗しました';
    return createErrorResponse(errorMessage, 400);
  }
});

// ユーザーを削除（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  try {
    const id = extractIdFromUrl(request.url);

    if (!id) {
      return createErrorResponse('ユーザーIDが必要です', 400);
    }

    // 自分自身の削除を防ぐ
    if (id === user.id) {
      return createErrorResponse('自分自身は削除できません', 403);
    }

    const success = await deleteUser(id);
    if (!success) {
      return createErrorResponse('ユーザーの削除に失敗しました', 400);
    }

    console.log('ユーザー削除成功 - ID:', id);
    return createSuccessResponse(null, 'ユーザーが正常に削除されました');
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return createErrorResponse('ユーザーの削除に失敗しました', 500);
  }
});
