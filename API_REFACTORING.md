# 型安全APIリファクタリング完了

このプロジェクトのAPIが型安全に最適化され、以下の改善が行われました。

## 🚀 主な改善点

### 1. 型安全性の向上
- **強化された型定義**: `api-types.ts`で包括的な型定義を提供
- **バリデーションスキーマ**: `validation-schemas.ts`でリクエストの検証
- **型安全なAPIハンドラー**: 全てのエンドポイントで型チェック

### 2. 統合認証システム
- **複数認証方式対応**: セッション認証とAPIキー認証の統合
- **権限ベースアクセス制御**: 詳細な権限管理
- **セキュリティ強化**: レート制限とエラーハンドリング

### 3. エラーハンドリングの標準化
- **統一エラーレスポンス**: 一貫したエラー形式
- **詳細なエラーコード**: 問題の特定が容易
- **グローバルエラーハンドラー**: 中央集権的なエラー管理

### 4. パフォーマンス最適化
- **効率的なバリデーション**: 早期検証による処理速度向上
- **メモリ使用量監視**: リソース使用量の追跡
- **リクエストトレーシング**: デバッグとモニタリング

## 📁 新しいファイル構造

```
app/lib/
├── api-types.ts           # 型定義（新規）
├── validation-schemas.ts  # バリデーションスキーマ（新規）
├── api-utils.ts          # APIユーティリティ（強化）
├── api-error-handler.ts  # エラーハンドラー（新規）
└── types.ts              # レガシー型定義（後方互換性）
```

## 🔧 使用方法

### API エンドポイントの作成例

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  withIntegratedAuth, 
  createSuccessResponse, 
  validateData,
  handleApiError
} from '@/app/lib/api-utils';
import { exampleSchema } from '@/app/lib/validation-schemas';
import { ExampleRequest, ExampleResponse } from '@/app/lib/api-types';

export const POST = withIntegratedAuth<[]>(
  async (request: NextRequest, context): Promise<NextResponse> => {
    try {
      const body: ExampleRequest = await request.json();
      
      // バリデーション
      const validation = validateData(
        body as unknown as Record<string, unknown>, 
        exampleSchema
      );
      
      if (!validation.isValid) {
        return createErrorResponse(
          validation.errors.map(e => e.message).join(', '),
          400
        );
      }

      // ビジネスロジック
      const result = await processExample(body);
      
      const response: ExampleResponse = { data: result };
      return createSuccessResponse(response, '処理が完了しました');
    } catch (error) {
      return handleApiError(error);
    }
  },
  { resource: 'examples', action: 'create' }
);
```

### バリデーションスキーマの定義例

```typescript
// app/lib/validation-schemas.ts
export const exampleSchema: ValidationSchema<ExampleRequest> = {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  email: {
    required: true,
    type: 'email'
  },
  age: {
    type: 'number',
    min: 0,
    max: 120
  },
  customField: {
    custom: (value) => {
      if (typeof value === 'string' && value.startsWith('custom_')) {
        return true;
      }
      return 'カスタムフィールドは "custom_" で始まる必要があります';
    }
  }
};
```

### 型定義の作成例

```typescript
// app/lib/api-types.ts
export interface ExampleRequest {
  title: string;
  email: string;
  age?: number;
  customField?: string;
}

export interface ExampleResponse {
  data: {
    id: string;
    processedAt: Date;
    status: 'success' | 'pending';
  };
}
```

## 🔐 認証システム

### セッション認証
```typescript
// 自動的にCookieからトークンを検証
const context = await authenticateRequest(request);
if (context.authMethod === 'session') {
  console.log('ユーザー:', context.user?.username);
}
```

### APIキー認証
```typescript
// ヘッダーからAPIキーを検証
const context = await authenticateRequest(
  request, 
  { resource: 'posts', action: 'create' }
);
if (context.authMethod === 'apikey') {
  console.log('APIキー権限:', context.apiKey?.permissions);
}
```

## 🛡️ エラーハンドリング

### カスタムエラーの使用

```typescript
import { ApiError, ApiErrorCode } from '@/app/lib/api-error-handler';

// 明示的なエラー
throw new ApiError(
  'リソースが見つかりません',
  ApiErrorCode.NOT_FOUND,
  404
);

// バリデーションエラー
throw new ValidationApiError(validationErrors);

// 権限エラー
throw new AuthorizationApiError('管理者権限が必要です');
```

### グローバルエラーハンドラー

```typescript
import { handleGlobalApiError } from '@/app/lib/api-error-handler';

try {
  // API処理
} catch (error) {
  return handleGlobalApiError(error);
}
```

## 📊 レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "message": "処理が完了しました",
  "meta": {
    "timestamp": "2025-07-31T10:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": "バリデーションエラーが発生しました",
  "code": "VALIDATION_ERROR",
  "details": {
    "validationErrors": [
      {
        "field": "email",
        "message": "メールアドレスの形式が正しくありません",
        "code": "INVALID_FORMAT"
      }
    ]
  }
}
```

## 🚀 移行ガイド

### 既存コードの更新

1. **新しいインポートの使用**
```typescript
// Before
import { createSuccessResponse } from '@/app/lib/api-utils';

// After
import { 
  createSuccessResponse, 
  withIntegratedAuth,
  validateData,
  handleApiError
} from '@/app/lib/api-utils';
```

2. **型定義の更新**
```typescript
// Before
interface CustomRequest {
  name: string;
}

// After - api-types.tsに移動
export interface CustomRequest {
  name: string;
}
```

3. **バリデーションの統合**
```typescript
// Before
if (!data.name) {
  return createErrorResponse('名前は必須です', 400);
}

// After
const validation = validateData(data, customSchema);
if (!validation.isValid) {
  return createErrorResponse(
    validation.errors.map(e => e.message).join(', '),
    400
  );
}
```

## 🔍 デバッグとモニタリング

### ログ出力
```typescript
import { logApiCall } from '@/app/lib/api-error-handler';

logApiCall('info', 'API呼び出し開始', context, undefined, { userId: 123 });
```

### パフォーマンス測定
```typescript
import { 
  startPerformanceTracking, 
  endPerformanceTracking 
} from '@/app/lib/api-error-handler';

const metrics = startPerformanceTracking();
// ... 処理 ...
const finalMetrics = endPerformanceTracking(metrics);
console.log(`処理時間: ${finalMetrics.duration}ms`);
```

## 📚 利用可能なAPI

### 投稿API
- `POST /api/posts` - 投稿作成（認証 + レート制限）
- `GET /api/posts` - 投稿一覧（認証）

### 認証API
- `POST /api/auth/login` - ログイン（レート制限）
- `GET /api/auth/me` - 現在のユーザー情報

### 管理者API
- `GET /api/admin/users` - ユーザー一覧（管理者権限）
- `POST /api/admin/users` - ユーザー作成（管理者権限）
- `GET /api/admin/api-keys` - APIキー管理（管理者権限）

## 🎯 今後の改善

- [ ] OpenAPI/Swagger仕様の生成
- [ ] 自動テスト生成
- [ ] APIドキュメント自動更新
- [ ] メトリクス収集システム
- [ ] 分散トレーシング対応

---

このリファクタリングにより、APIの保守性、拡張性、セキュリティが大幅に向上しました。型安全性により、開発時のエラーを早期に発見でき、より安定したアプリケーションの開発が可能になります。
