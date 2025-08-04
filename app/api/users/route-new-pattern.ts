import { NextRequest } from 'next/server';
import { createRestGetHandler, createRestPostHandler } from '@/app/lib/api/factory/rest-factory';
import { isUserCreateRequest, UserCreateRequest } from '@/app/lib/api/schemas/validation-schemas';
import { userRepository } from '@/app/lib/data/repositories/user-repository';
import { UserEntity } from '@/app/lib/core/types/entity-types';

// ============================================================================
// 新しい統一RESTfulパターンを使用したユーザーAPI
// これは既存のroute.tsを段階的に置き換えるためのテンプレートです
// ============================================================================

/**
 * GET /api/users - ユーザー一覧取得
 * 新しい統一ファクトリーパターンを使用
 */
export const GET_NEW = createRestGetHandler<UserEntity[]>(
  async (request: NextRequest, currentUser?: UserEntity) => {
    const url = new URL(request.url);
    
    // クエリパラメータ解析（統一された方法）
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100);
    const search = url.searchParams.get('search') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // 権限チェック（ファクトリーで統一的に処理）
    if (!currentUser || (currentUser.role !== 'admin')) {
      if (!currentUser) {
        throw new Error('Authentication required');
      }
      const user = await userRepository.findById(currentUser.id);
      if (!user.success || !user.data) {
        throw new Error('User not found');
      }
      return [user.data];
    }

    // データ取得
    const result = await userRepository.findAll({
      search,
      sortBy,
      sortOrder,
      page,
      limit
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to fetch users');
    }

    return result.data.data;
  },
  {
    requireAuth: true,
    allowedMethods: ['GET'],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    }
  }
);

/**
 * POST /api/users - ユーザー作成
 * 新しい統一ファクトリーパターンとバリデーションスキーマを使用
 */
export const POST_NEW = createRestPostHandler<UserCreateRequest, UserEntity>(
  async (request: NextRequest, body: UserCreateRequest, currentUser?: UserEntity) => {
    // 新規ユーザー作成（統一されたバリデーションとエラーハンドリング）
    // UserCreateRequestからUserInputに変換
    const userInput = {
      username: body.username,
      email: body.email,
      password: body.password,
      displayName: body.displayName || body.username,
      role: body.role || 'user' as const
    };
    
    const result = await userRepository.create(userInput);
    
    if (!result.success || !result.data) {
      throw new Error('Failed to create user');
    }
    
    return result.data;
  },
  isUserCreateRequest, // 統一されたバリデーションスキーマ
  {
    requireAuth: true,
    requireAdmin: true,
    allowedMethods: ['POST'],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10
    }
  }
);

// ============================================================================
// 移行ガイド
// ============================================================================

/**
 * 現在の実装との比較：
 * 
 * 1. より少ないコード量
 *    - 認証・認可ロジックは統一ファクトリーが処理
 *    - エラーハンドリングは自動化
 *    - レスポンス形式は統一
 * 
 * 2. 統一されたバリデーション
 *    - isUserCreateRequest で型安全なバリデーション
 *    - 再利用可能なスキーマ
 * 
 * 3. レート制限の統合
 *    - 設定は宣言的
 *    - 自動適用
 * 
 * 4. 型安全性の向上
 *    - より厳密なTypeScript型
 *    - ランタイムエラーの削減
 * 
 * 移行手順：
 * 1. 既存のGET, POSTをコメントアウト
 * 2. GET_NEW, POST_NEWをGET, POSTに改名
 * 3. テスト実行
 * 4. 問題なければ既存コードを削除
 */
