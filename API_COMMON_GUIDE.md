# APIフォルダ共通化ガイド

このドキュメントでは、厳格な型安全を前提としたAPIスクリプトの共通化アプローチについて説明します。

## 概要

APIフォルダ内のスクリプトを以下の5つの層に分けて共通化しました：

1. **型定義層** (`api-types.ts`) - 厳格な型定義とヘルパー関数
2. **共通ファクトリー層** (`api-factory.ts`) - 再利用可能なAPIハンドラー生成
3. **バリデーション層** (`validation-schemas.ts`) - 統一されたバリデーションルール
4. **エラーハンドリング層** (`api-error-handler.ts`) - 一貫したエラー処理
5. **ユーティリティ層** (`api-utils.ts`) - 認証、レート制限、共通処理

## 使用方法

### 1. 基本的なCRUD API

```typescript
// app/api/users/route.ts
import { createCrudHandlers } from '@/app/lib/api-factory';
import { postCreateSchema } from '@/app/lib/validation-schemas';

// CRUDサービスの実装
class UserService implements CrudService<User, UserCreateRequest, UserUpdateRequest> {
  async getAll(filters?: Record<string, unknown>): Promise<User[]> {
    // 実装
  }
  
  async getById(id: string): Promise<User | null> {
    // 実装
  }
  
  async create(data: UserCreateRequest): Promise<User> {
    // 実装
  }
  
  async update(id: string, data: UserUpdateRequest): Promise<User | null> {
    // 実装
  }
  
  async delete(id: string): Promise<boolean> {
    // 実装
  }
}

// ハンドラーの生成
const userService = new UserService();
const handlers = createCrudHandlers(userService, {
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
  requireAuth: true,
  requireAdmin: true
});

export const GET = handlers.GET;
export const POST = handlers.POST;
```

### 2. カスタムAPIハンドラー

```typescript
// app/api/posts/route.ts
import { 
  createGetHandler, 
  createPostHandler 
} from '@/app/lib/api-factory';
import { postCreateSchema, postListSchema } from '@/app/lib/validation-schemas';

// 投稿一覧取得（公開API）
export const GET = createGetHandler<PostsListResponse>(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const filters = parseSearchParams(searchParams);
    const posts = await getAllPosts(filters);
    return createApiSuccess({ posts, total: posts.length });
  },
  {
    requireAuth: false, // 公開API
    validationSchema: postListSchema
  }
);

// 投稿作成（認証必須）
export const POST = createPostHandler<PostCreateRequest, PostResponse>(
  async (request, body, user) => {
    const newPost = await createPost({
      ...body,
      author: user?.username || 'anonymous'
    });
    return createApiSuccess({ post: newPost });
  },
  {
    requireAuth: true,
    validationSchema: postCreateSchema,
    rateLimit: {
      maxRequests: 5,
      windowMs: 60000
    }
  }
);
```

### 3. 管理者専用API

```typescript
// app/api/admin/users/route.ts
import { createAdminApiHandler } from '@/app/lib/api-factory';

export const GET = createAdminApiHandler(
  async (request) => {
    const users = await getAllUsers();
    return createApiSuccess({ users });
  }
);
```

### 4. 設定管理API

```typescript
// app/api/settings/route.ts
import { createGetHandler, createPutHandler } from '@/app/lib/api-factory';
import { settingsUpdateSchema } from '@/app/lib/validation-schemas';

// 設定取得
export const GET = createGetHandler(
  async (request) => {
    const settings = await getSettings();
    return createApiSuccess({ settings });
  },
  {
    requireAuth: true,
    requireAdmin: true
  }
);

// 設定更新
export const PUT = createPutHandler<SettingsUpdateRequest, SettingsResponse>(
  async (request, body, user) => {
    const updatedSettings = await updateSettings(body);
    return createApiSuccess({ settings: updatedSettings });
  },
  {
    requireAuth: true,
    requireAdmin: true,
    validationSchema: settingsUpdateSchema
  }
);
```

## バリデーションスキーマの活用

### 既存スキーマの使用

```typescript
import { 
  postCreateSchema,
  userCreateSchema,
  commentCreateSchema 
} from '@/app/lib/validation-schemas';

// 基本的な使用
const schema = postCreateSchema;

// カスタム組み合わせ
const customSchema = {
  ...postCreateSchema,
  customField: {
    type: 'string',
    required: true,
    minLength: 1
  }
};
```

### カスタムスキーマの作成

```typescript
import { ValidationSchema } from '@/app/lib/api-types';

// カスタムバリデーションスキーマ
const customPostSchema: ValidationSchema<CustomPostRequest> = {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  content: {
    required: true,
    type: 'string',
    minLength: 10
  },
  category: {
    required: true,
    type: 'string',
    enum: ['tech', 'life', 'work']
  },
  tags: {
    type: 'array',
    items: {
      type: 'string',
      minLength: 1,
      maxLength: 20
    },
    maxItems: 5
  }
};
```

## エラーハンドリングの統一

### 自動エラー処理

```typescript
import { handleApiError } from '@/app/lib/api-utils';
import { ApiError } from '@/app/lib/api-error-handler';

export const GET = async (request: NextRequest) => {
  try {
    // リスクのある操作
    const data = await riskyOperation();
    return createSuccessResponse(data);
  } catch (error) {
    // 統一されたエラーハンドリング
    return handleApiError(error, {
      endpoint: '/api/example',
      method: 'GET'
    });
  }
};
```

### 手動エラー処理

```typescript
import { handleApiError } from '@/app/lib/api-utils';
import { ApiError, ApiErrorCode } from '@/app/lib/api-error-handler';

export const POST = async (request: NextRequest) => {
  try {
    const result = await someOperation();
    return createSuccessResponse(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, error.code, error.statusCode);
    }
    return handleApiError(error, {
      endpoint: '/api/example',
      method: 'POST'
    });
  }
};
```

## 型安全性の保証

### 厳格な型チェック

すべてのAPIハンドラーは以下の型安全性を保証します：

- リクエストボディの型チェック
- レスポンスデータの型チェック
- URLパラメータの型チェック
- バリデーションスキーマとの整合性

### 型ガード関数の使用

```typescript
import { 
  ApiErrorCode,
  ValidationSchema
} from '@/app/lib/api-types';

// 型安全なパラメータ解析
const parseUserRole = (value: string | null): 'user' | 'admin' | null => {
  if (value === 'user' || value === 'admin') {
    return value;
  }
  return null;
};

// 使用例
const role = parseUserRole(searchParams.get('role'));
if (role) {
  // roleは確実に 'user' | 'admin' の型
  filters.role = role;
}
```

## レート制限とキャッシュ

### レート制限の設定

```typescript
import { createPostHandler } from '@/app/lib/api-factory';

export const POST = createPostHandler(
  async (request, body, user) => {
    // ハンドラーロジック
    return createApiSuccess(result);
  },
  {
    requireAuth: true,
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000, // 1分間
      keyGenerator: (req) => req.ip || 'anonymous'
    }
  }
);
```

## 監視とログ

### エラー監視

```typescript
import { ApiError } from '@/app/lib/api-error-handler';
import { handleApiError } from '@/app/lib/api-utils';

// APIエラーのログ記録
const logApiError = (error: ApiError, context: { endpoint: string; method: string }) => {
  console.error(`[API Error] ${context.method} ${context.endpoint}:`, {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details
  });
};

// エラーハンドリングでの使用
try {
  // 何らかの処理
} catch (error) {
  if (error instanceof ApiError) {
    logApiError(error, { endpoint: '/api/example', method: 'GET' });
  }
  return handleApiError(error);
}
```

## 移行ガイド

### 既存APIの移行手順

1. **現在のAPIハンドラーの分析**
   ```typescript
   // 移行前
   export async function POST(request: NextRequest) {
     // 認証チェック
     // バリデーション
     // ビジネスロジック
     // エラーハンドリング
     // レスポンス作成
   }
   ```

2. **共通化されたハンドラーへの移行**

   ```typescript
   // 移行後
   import { createPostHandler } from '@/app/lib/api-factory';
   import { postCreateSchema } from '@/app/lib/validation-schemas';
   
   export const POST = createPostHandler<RequestType, ResponseType>(
     async (request, body, user) => {
       // ビジネスロジックのみ
       return createApiSuccess(result);
     },
     {
       requireAuth: true,
       validationSchema: postCreateSchema,
       rateLimit: {
         maxRequests: 10,
         windowMs: 60000
       }
     }
   );
   ```

3. **段階的移行**
   - 新しいエンドポイントから開始
   - 既存エンドポイントを順次移行
   - テストの実行と検証

## ベストプラクティス

1. **型定義を最初に作成** - APIの仕様を型で定義してから実装
2. **バリデーションスキーマの再利用** - 既存のスキーマを活用し、必要に応じてカスタマイズ
3. **エラーハンドリングの統一** - すべてのエラーは `handleApiError` または `ApiError` クラスを使用
4. **適切な認証レベルの設定** - 公開API、認証API、管理者APIを明確に分離
5. **レート制限の適用** - 悪用を防ぐため適切なレート制限を設定
6. **型安全性の確保** - TypeScriptの型システムを活用し、ランタイムエラーを防止

## 今後の拡張

1. **キャッシュ機能の追加** - Redis等を使った応答キャッシュ
2. **API仕様の自動生成** - OpenAPI/Swagger仕様の自動生成
3. **テストユーティリティの追加** - APIテスト用のヘルパー関数
4. **監視機能の強化** - メトリクス収集とアラート機能
5. **マイクロサービス対応** - サービス間通信の標準化
6. **認証方式の拡張** - OAuth2、JWT等の追加サポート

この共通化により、APIの一貫性、保守性、型安全性が大幅に向上し、開発効率も向上します。また、新しい開発者がプロジェクトに参加した際の学習コストも削減されます。
