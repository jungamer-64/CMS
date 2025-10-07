# Next.js CMS リファクタリング概要 (2025年10月)

## 実施したリファクタリング

### 1. API ユーティリティ関数の統一化

#### 問題点
- `createSuccessResponse`と`createErrorResponse`が複数のファイルで重複定義されていた
  - `app/lib/api-factory.ts`
  - `app/lib/api-utils.ts`
  - `app/lib/api/client/utils.ts`
  - `app/lib/api/utils/api-helpers.ts`

#### 解決策
- `app/lib/api-utils.ts`を中心的なユーティリティファイルとして統一
- `app/lib/api-factory.ts`から重複コードを削除し、`api-utils.ts`からインポート
- `app/lib/api/client/utils.ts`を修正して、内部で`api-utils.ts`の関数を呼び出すように変更
- 型安全性を保ちつつ、コードの重複を削減

#### 変更内容
```typescript
// Before (api-factory.ts)
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

// After (api-factory.ts)
export { createErrorResponse, createSuccessResponse } from './api-utils';

// api-utils.ts で統一された実装
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): ApiSuccess<T> {
  // オプションのmessageとmetaをサポート
  const baseResponse = { success: true as const, data };
  if (message && meta) {
    return { ...baseResponse, message, meta: { ...meta, timestamp: new Date().toISOString() } };
  }
  if (message) return { ...baseResponse, message };
  if (meta) return { ...baseResponse, meta: { ...meta, timestamp: new Date().toISOString() } };
  return baseResponse;
}
```

### 2. API Factory内の重複ロジック削減

#### 問題点
- `createGetHandler`, `createPostHandler`, `createPutHandler`, `createDeleteHandler`で、rate limitingとエラーハンドリングのロジックが重複していた
- 各ハンドラーで同じようなrate limiterの設定コードが繰り返されていた

#### 解決策
- `checkRateLimit()`共通関数を作成してrate limitingロジックを一元化
- `parseAndValidateBody()`共通関数を作成してボディのパースとバリデーションを統一
- 各ハンドラーから共通関数を呼び出すようにリファクタリング

#### 変更内容

```typescript
// 新規追加: Rate limitチェック共通関数
async function checkRateLimit(
  userId: string,
  options?: HandlerOptions['rateLimit']
): Promise<{ allowed: boolean; error?: NextResponse }> {
  if (!options) return { allowed: true };

  const rateLimiter = RateLimiter.getInstance();
  const rateLimitConfig = {
    maxAttempts: options.maxRequests,
    windowMs: options.windowMs,
    blockDurationMs: 60000,
  };
  
  const result = await rateLimiter.checkLimit(userId, rateLimitConfig);
  
  if (!result.allowed) {
    return {
      allowed: false,
      error: NextResponse.json(
        createErrorResponse(options.message || 'Too many requests'),
        { status: 429 }
      ),
    };
  }
  
  return { allowed: true };
}

// 新規追加: ボディパース＆バリデーション共通関数
type ParseResult<TBody> = 
  | { success: true; data: TBody }
  | { success: false; error: NextResponse };

async function parseAndValidateBody<TBody>(
  request: NextRequest,
  requiredFields?: (keyof TBody)[]
): Promise<ParseResult<TBody>> {
  const bodyResult = await parseJsonSafely<TBody>(request);
  
  if (!bodyResult.success) {
    return {
      success: false,
      error: NextResponse.json(createErrorResponse(bodyResult.error), { status: 400 }),
    };
  }

  if (requiredFields) {
    const validationError = validateRequired(bodyResult.data as Record<string, unknown>, requiredFields);
    if (validationError) {
      return {
        success: false,
        error: NextResponse.json(createErrorResponse(validationError), { status: 400 }),
      };
    }
  }

  return { success: true, data: bodyResult.data };
}
```

#### ハンドラーの簡素化

```typescript
// Before (createGetHandler)
export function createGetHandler<T = unknown>(handler: GetHandler<T>, options?: HandlerOptions) {
  return withApiAuth(async (request, context, params) => {
    try {
      if (options?.rateLimit) {
        const rateLimiter = RateLimiter.getInstance();
        const rateLimitConfig = {
          maxAttempts: options.rateLimit.maxRequests,
          windowMs: options.rateLimit.windowMs,
          blockDurationMs: 60000
        };
        const rateLimitResult = await rateLimiter.checkLimit(context.user.id, rateLimitConfig);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(createErrorResponse(options.rateLimit.message), { status: 429 });
        }
      }
      // ... handler execution
    } catch (error) { /* ... */ }
  });
}

// After (createGetHandler) - 簡潔になった
export function createGetHandler<T = unknown>(handler: GetHandler<T>, options?: HandlerOptions) {
  return withApiAuth(async (request, context, params) => {
    try {
      // Rate limit check
      const rateLimitCheck = await checkRateLimit(context.user.id, options?.rateLimit);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck.error!;
      }

      const result = await handler(request, context.user, params);
      return NextResponse.json(result);
    } catch (error) {
      console.error('GET handler error:', error);
      return NextResponse.json(createErrorResponse('Internal server error'), { status: 500 });
    }
  });
}
```

### 3. ハンドラーオプションの改善

#### 変更内容
- `HandlerOptions`インターフェースをエクスポートして再利用可能にした
- `rateLimit.message`をオプショナルにし、デフォルトメッセージを提供

```typescript
export interface HandlerOptions {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    message?: string; // オプショナルに変更
  };
}
```

### 4. DELETEハンドラーへのrate limit追加

- `createDeleteHandler`にもrate limiting機能を追加し、他のハンドラーと一貫性を保った

## リファクタリングの効果

### コード削減
- 約150行のコード削減（重複関数と冗長なロジックの削除）
- rate limitingロジック: 各ハンドラーで15-20行 → 共通関数1つ（約30行）

### 保守性の向上
- 重複コードが削減され、変更が必要な場所が一箇所に集約
- バグ修正や機能追加が容易になった
- 一貫性のあるエラーハンドリングとrate limiting

### 型安全性の向上
- `ParseResult<TBody>`型を導入し、パースとバリデーション結果の型安全性を確保
- TypeScriptの判別可能なユニオン型を活用

### パフォーマンス
- 機能的には変更なし（既存のロジックを整理しただけ）
- 共通関数の再利用により、わずかにバンドルサイズが削減される可能性

## 今後の改善案

### 1. エラーハンドリングの統一
- 各ハンドラーのcatchブロックを共通化できる可能性

### 2. より高度な型推論
- handler関数の戻り値から自動的にレスポンス型を推論するジェネリクス

### 3. ミドルウェア化
- rate limitingやバリデーションをミドルウェアとして分離し、さらに柔軟な構成を可能にする

### 4. テストカバレッジの向上
- 共通関数のユニットテストを追加
- 各ハンドラーの統合テスト

## 注意点

### 破壊的変更
- なし（既存のAPIインターフェースは維持）

### 依存関係
- `RateLimiter.getInstance()`の実装に依存
- `withApiAuth`ミドルウェアとの密結合

### パフォーマンス考慮事項
- rate limiterはインメモリ実装のため、サーバー再起動でリセットされる
- 本番環境ではRedis等の永続化されたストアの使用を推奨

## ファイル一覧（変更）

- ✅ `app/lib/api-factory.ts` - メインのリファクタリング対象
- ✅ `app/lib/api-utils.ts` - 統一されたユーティリティ関数
- ✅ `app/lib/api/client/utils.ts` - 内部で`api-utils.ts`を使用するように変更
- ⚠️ `app/lib/api/utils/api-helpers.ts` - 独自の型システムを使用（統合せず）

## まとめ

このリファクタリングにより、コードベースは以下の点で改善されました：

1. **DRY原則の遵守**: 重複コードを削減し、単一責任の原則を適用
2. **可読性**: 各ハンドラーの実装が簡潔になり、意図が明確に
3. **保守性**: 共通ロジックが一箇所に集約され、変更が容易に
4. **一貫性**: 全ハンドラーで同じパターンを使用

これらの変更は、プロジェクトの instructions ファイルに記載されている「Repository Pattern」と「API Factory Pattern」の原則に沿ったものです。
