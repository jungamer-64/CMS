import { createDeleteHandler, createGetHandler, createPostHandler } from '@/app/lib/api-factory';
import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-utils';
import { User } from '@/app/lib/core/types';
import { connectToDatabase } from '@/app/lib/database/connection';
import { createApiKeyModel } from '@/app/lib/database/models/api-key';
import { NextRequest } from 'next/server';

// ============================================================================
// APIキー管理API - データベース統合版
// ============================================================================

interface ApiKeyResponse {
  id: string;
  name: string;
  key: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastUsed?: string;
  usageCount: number;
}

interface CreateApiKeyRequest {
  name: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
}

// APIキーを生成する関数
function generateApiKey(): string {
  const prefix = 'sk-test-';
  const randomPart = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return prefix + randomPart;
}

// APIキーIDを生成する関数
function generateKeyId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

// ============================================================================
// GET /api/api-keys - APIキー一覧取得（データベース版）
// ============================================================================

export const GET = createGetHandler<ApiKeyResponse[]>(
  async (_request: NextRequest, user: User) => {
    // 管理者のみアクセス可能
    if (user.role !== 'admin') {
      return createErrorResponse('管理者権限が必要です', 403);
    }

    try {
      // データベース接続
      await connectToDatabase();
      const apiKeyModel = await createApiKeyModel();

      // 全APIキーを取得
      const apiKeys = await apiKeyModel.findAll();

      // レスポンス形式に変換
      const response: ApiKeyResponse[] = apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key,
        permissions: key.permissions,
        isActive: key.isActive,
        createdAt: key.createdAt.toISOString(),
        createdBy: key.createdBy,
        lastUsed: key.lastUsed?.toISOString(),
        usageCount: key.usageCount
      }));

      return createSuccessResponse(response);
    } catch (err: unknown) {
      console.error('APIキー取得エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('APIキーの取得に失敗しました');
    }
  }
);

// ============================================================================
// POST /api/api-keys - APIキー作成（データベース版）
// ============================================================================

export const POST = createPostHandler<CreateApiKeyRequest, ApiKeyResponse>(
  async (_request: NextRequest, body: CreateApiKeyRequest, user: User) => {
    // 管理者のみアクセス可能
    if (user.role !== 'admin') {
      return createErrorResponse('管理者権限が必要です', 403);
    }

    // バリデーション
    if (!body.name || typeof body.name !== 'string') {
      return createErrorResponse('APIキー名が必要です');
    }

    try {
      // データベース接続
      await connectToDatabase();
      const apiKeyModel = await createApiKeyModel();

      // 新しいAPIキーを作成
      const newApiKey = await apiKeyModel.create({
        id: generateKeyId(),
        name: body.name,
        key: generateApiKey(),
        permissions: body.permissions || {
          read: true,
          write: false,
          admin: false
        },
        isActive: true,
        createdBy: user.id
      });

      // レスポンス形式に変換
      const response: ApiKeyResponse = {
        id: newApiKey.id,
        name: newApiKey.name,
        key: newApiKey.key,
        permissions: newApiKey.permissions,
        isActive: newApiKey.isActive,
        createdAt: newApiKey.createdAt.toISOString(),
        createdBy: newApiKey.createdBy,
        lastUsed: newApiKey.lastUsed?.toISOString(),
        usageCount: newApiKey.usageCount
      };

      return createSuccessResponse(response);
    } catch (err: unknown) {
      console.error('APIキー作成エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('APIキーの作成に失敗しました');
    }
  }
);

// ============================================================================
// DELETE /api/api-keys - APIキー削除（データベース版）
// ============================================================================

export const DELETE = createDeleteHandler<{ message: string }>(
  async (request: NextRequest, user: User) => {
    // 管理者のみアクセス可能
    if (user.role !== 'admin') {
      return createErrorResponse('管理者権限が必要です', 403);
    }

    try {
      const url = new URL(request.url);
      const keyId = url.searchParams.get('id');

      if (!keyId) {
        return createErrorResponse('APIキーIDが必要です');
      }

      // データベース接続
      await connectToDatabase();
      const apiKeyModel = await createApiKeyModel();

      // APIキーを削除
      const deleted = await apiKeyModel.delete(keyId);

      if (!deleted) {
        return createErrorResponse('APIキーが見つかりません', 404);
      }

      return createSuccessResponse({ message: 'APIキーを削除しました' });
    } catch (err: unknown) {
      console.error('APIキー削除エラー:', err instanceof Error ? err : String(err));
      return createErrorResponse('APIキーの削除に失敗しました');
    }
  }
);
