import { NextRequest } from 'next/server';
import { createGetHandler, createPutHandler } from '@/app/lib/api-factory';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { User } from '@/app/lib/core/types';
import { connectToDatabase } from '@/app/lib/database/connection';
import { createUserModel } from '@/app/lib/database/models/user';

// ============================================================================
// ユーザーテーマ設定API - データベース統合版
// ============================================================================

interface ThemeData {
  darkMode: boolean;
}

interface ThemeUpdateRequest {
  darkMode: boolean;
}

// ============================================================================
// GET /api/users/[id]/theme - ユーザーテーマ取得（データベース版）
// ============================================================================

export const GET = createGetHandler<ThemeData>(
  async (request: NextRequest, user: User) => {
    try {
      const url = new URL(request.url);
      const userId = url.pathname.split('/')[3]; // /api/users/[id]/theme

      // 自分のテーマまたは管理者のみアクセス可能
      if (user.id !== userId && user.role !== 'admin') {
        return createErrorResponse('アクセス権限がありません', 403);
      }

      // データベース接続
      await connectToDatabase();
      const userModel = await createUserModel();

      // ユーザーを取得
      const userData = await userModel.findById(userId);
      if (!userData) {
        return createErrorResponse('ユーザーが見つかりません', 404);
      }

      return createSuccessResponse({ darkMode: userData.darkMode || false });
    } catch (error) {
      console.error('ユーザーテーマ取得エラー:', error);
      return createErrorResponse('テーマ設定の取得に失敗しました');
    }
  }
);

// ============================================================================
// PUT /api/users/[id]/theme - ユーザーテーマ更新（データベース版）
// ============================================================================

export const PUT = createPutHandler<ThemeUpdateRequest, ThemeData>(
  async (request: NextRequest, body: ThemeUpdateRequest, user: User) => {
    try {
      const url = new URL(request.url);
      const userId = url.pathname.split('/')[3]; // /api/users/[id]/theme

      // 自分のテーマまたは管理者のみ更新可能
      if (user.id !== userId && user.role !== 'admin') {
        return createErrorResponse('アクセス権限がありません', 403);
      }

      // バリデーション
      if (typeof body.darkMode !== 'boolean') {
        return createErrorResponse('無効なテーマ設定です');
      }

      // データベース接続
      await connectToDatabase();
      const userModel = await createUserModel();

      // ユーザーのテーマを更新
      const success = await userModel.updateTheme(userId, body.darkMode);
      if (!success) {
        return createErrorResponse('ユーザーが見つかりません', 404);
      }
      
      return createSuccessResponse({ darkMode: body.darkMode });
    } catch (error) {
      console.error('ユーザーテーマ更新エラー:', error);
      return createErrorResponse('テーマ設定の更新に失敗しました');
    }
  }
);
