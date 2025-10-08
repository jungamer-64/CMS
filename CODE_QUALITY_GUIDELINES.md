# コード品質ガイドライン

## セキュリティベストプラクティス

### RegExpセキュリティ

動的な正規表現を使用する場合は、ReDoS（Regular Expression Denial of Service）攻撃を防ぐため以下の対策を実施してください：

```typescript
// ❌ 悪い例
const regex = new RegExp(userInput);

// ✅ 良い例
const MAX_LENGTH = 100;
const sanitizedInput = userInput.slice(0, MAX_LENGTH);
const escapedInput = sanitizedInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

try {
  const regex = new RegExp(escapedInput, 'i');
  return regex.test(value);
} catch (error) {
  console.error('Invalid regex:', error);
  return false;
}
```

### 実装例

#### BaseRepository - buildSearchRegex

```typescript
protected buildSearchRegex(search?: string): RegExp | undefined {
  if (!search || search.trim().length === 0) return undefined;

  // 検索文字列の長さを制限
  const MAX_SEARCH_LENGTH = 100;
  const sanitizedSearch = search.trim().slice(0, MAX_SEARCH_LENGTH);

  // すべての特殊文字をエスケープ
  const escapedSearch = sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    return new RegExp(escapedSearch, 'i');
  } catch (error) {
    console.error('Invalid regex pattern:', error);
    return undefined;
  }
}
```

#### MultilingualForm - validatePattern

```typescript
validatePattern(value: string, pattern: string | RegExp): string | null {
  try {
    const regexPattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    // 値の長さを制限
    const MAX_VALUE_LENGTH = 1000;
    const testValue = value.slice(0, MAX_VALUE_LENGTH);

    if (!regexPattern.test(testValue)) {
      return this.t('validation:validation.pattern');
    }
    return null;
  } catch (error) {
    console.error('Pattern validation error:', error);
    return this.t('validation:validation.pattern');
  }
}
```

## 複雑度管理

### 循環的複雑度（Cyclomatic Complexity）

循環的複雑度は8以下を目指してください。複雑な関数は以下の方法で分割します：

#### 1. ヘルパー関数への分割

```typescript
// ❌ 複雑度が高い
function validateAll(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.email) errors.email = 'Required';
  else if (!isEmail(data.email)) errors.email = 'Invalid';
  if (!data.password) errors.password = 'Required';
  else if (data.password.length < 8) errors.password = 'Too short';
  // ... 20行以上続く
  return errors;
}

// ✅ ヘルパー関数に分割
function validateEmail(email: string): string | null {
  if (!email) return 'Required';
  if (!isEmail(email)) return 'Invalid';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Required';
  if (password.length < 8) return 'Too short';
  return null;
}

function validateAll(data: FormData): Errors {
  return {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
  };
}
```

#### 2. ルールベースのアプローチ

```typescript
// ✅ ルールマップを使用
const validationRules = [
  { field: 'email', validators: [required, isEmail] },
  { field: 'password', validators: [required, minLength(8)] },
];

function validateAll(data: FormData): Errors {
  const errors: Errors = {};
  for (const rule of validationRules) {
    for (const validator of rule.validators) {
      const error = validator(data[rule.field]);
      if (error) {
        errors[rule.field] = error;
        break;
      }
    }
  }
  return errors;
}
```

## コードの分割

### 50行以上の関数

50行以上の関数は以下の基準で分割を検討してください：

1. **論理的なセクション**: 機能ごとにヘルパー関数に分割
2. **繰り返しパターン**: ループや類似処理を抽出
3. **責務の分離**: 単一責任の原則に従う

### 例：長い関数の分割

```typescript
// ❌ 長すぎる関数（70行）
async function processOrder(order: Order) {
  // バリデーション（10行）
  // 在庫チェック（15行）
  // 決済処理（20行）
  // メール送信（15行）
  // ログ記録（10行）
}

// ✅ 分割された関数
async function validateOrder(order: Order): Promise<ValidationResult> {
  // バリデーションロジック（10行）
}

async function checkInventory(order: Order): Promise<boolean> {
  // 在庫チェックロジック（15行）
}

async function processPayment(order: Order): Promise<PaymentResult> {
  // 決済処理ロジック（20行）
}

async function sendConfirmationEmail(order: Order): Promise<void> {
  // メール送信ロジック（15行）
}

async function logOrderProcessing(order: Order, result: ProcessResult): Promise<void> {
  // ログ記録ロジック（10行）
}

async function processOrder(order: Order) {
  const validation = await validateOrder(order);
  if (!validation.valid) throw new Error(validation.error);

  const inStock = await checkInventory(order);
  if (!inStock) throw new Error('Out of stock');

  const payment = await processPayment(order);
  await sendConfirmationEmail(order);
  await logOrderProcessing(order, { payment });

  return { success: true, payment };
}
```

## 型安全性

### すべての型を明示的に定義

```typescript
// ❌ any型の使用
function process(data: any): any {
  return data.value;
}

// ✅ 明示的な型定義
interface InputData {
  value: string;
}

interface OutputData {
  processed: string;
}

function process(data: InputData): OutputData {
  return { processed: data.value };
}
```

### 型推論の活用

```typescript
// ✅ 型推論を活用
const users = await repository.findAll(); // User[] と推論される

// 必要に応じて明示的に型を指定
const users: User[] = await repository.findAll();
```

## エラーハンドリング

### 一貫したエラーレスポンス

```typescript
// BaseRepositoryのパターンを使用
protected createErrorResponse<T>(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): ApiResponse<T> {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  console.error(`Repository Error: ${errorMessage}`, error);

  return {
    success: false,
    error: errorMessage,
  };
}

protected createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}
```

### Try-Catchの適切な使用

```typescript
// ✅ エラーを適切に処理
try {
  const result = await riskyOperation();
  return this.createSuccessResponse(result);
} catch (error) {
  return this.createErrorResponse(error, 'Operation failed');
}
```

## パフォーマンス最適化

### 1. 不要な再レンダリングの防止

```typescript
// React.memo、useMemo、useCallbackの活用
const MemoizedComponent = React.memo(MyComponent);

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### 2. データベースクエリの最適化

```typescript
// インデックスを活用したクエリ
collection.createIndex({ email: 1 });
collection.createIndex({ createdAt: -1 });

// ページネーションの実装
const results = await collection
  .find(query)
  .skip((page - 1) * limit)
  .limit(limit)
  .toArray();
```

## テストのベストプラクティス

### ユニットテスト

```typescript
describe('BaseRepository', () => {
  describe('buildSearchRegex', () => {
    it('should escape special characters', () => {
      const repo = new TestRepository();
      const regex = repo['buildSearchRegex']('test.com');
      expect(regex?.source).toBe('test\\.com');
    });

    it('should limit search length', () => {
      const repo = new TestRepository();
      const longString = 'a'.repeat(200);
      const regex = repo['buildSearchRegex'](longString);
      expect(regex?.source.length).toBeLessThanOrEqual(100);
    });

    it('should handle invalid patterns gracefully', () => {
      const repo = new TestRepository();
      const regex = repo['buildSearchRegex']('');
      expect(regex).toBeUndefined();
    });
  });
});
```

## 型安全性ベストプラクティス (2025年10月8日追加)

### `any`型の使用禁止

TypeScriptの`any`型は型安全性を損なうため、**使用を禁止**します。

#### ❌ 悪い例

```typescript
// any型を使用すると型チェックが無効化される
const data: any = { name: 'test' };
data.unknownMethod(); // 実行時エラーになる可能性

// キャストで型安全性を回避
const result = (someData as any).field;
```

#### ✅ 良い例

```typescript
// 適切な型定義を使用
interface Data {
  name: string;
  age?: number;
}

const data: Data = { name: 'test' };
// data.unknownMethod(); // コンパイルエラーで早期発見

// 型ガードを使用
function isData(value: unknown): value is Data {
  return typeof value === 'object' && value !== null && 'name' in value;
}

if (isData(someData)) {
  console.log(someData.name); // 型安全
}
```

### Next.js 15の型対応

Next.js 15では動的ルートのparamsが`Promise`でラップされます。

#### ❌ 悪い例

```typescript
// Next.js 14の書き方（Next.js 15では型エラー）
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  // ...
}
```

#### ✅ 良い例

```typescript
// Next.js 15対応
export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params; // Promise解決
  const { id } = params;
  // ...
}

// または、ファクトリ関数を使用
export const GET = createGetHandler<ResponseType>(
  async (request, user, context) => {
    const params = await context.params;
    const { id } = params;
    // ...
  }
);
```

### 型定義の一元管理

型定義は`app/lib/core/types/api-unified.ts`に集約します。

#### ❌ 悪い例

```typescript
// 各ファイルで型を個別定義（重複のリスク）
// file1.ts
interface User { id: string; name: string; }

// file2.ts
interface User { id: string; name: string; email: string; } // 不一致!
```

#### ✅ 良い例

```typescript
// app/lib/core/types/api-unified.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

// 他のファイル
import type { User } from '@/app/lib/core/types/api-unified';
```

### オプショナルフィールドへの安全なアクセス

オプショナルフィールドには条件分岐でアクセスします。

#### ❌ 悪い例

```typescript
// 型キャストで無理やりアクセス
const small = (theme.typography.fontSize as any).small;
const spacing = (theme.layout as any).spacing;
```

#### ✅ 良い例

```typescript
// オプショナルチェーンまたは条件分岐
const small = theme.typography.fontSize?.small;

if (theme.layout?.spacing) {
  css += `--spacing: ${theme.layout.spacing};\n`;
}

// または、型定義を正確に
interface ThemeSettings {
  typography: {
    fontSize: {
      base: string;
      heading?: string;
      small?: string; // オプショナルを明示
    };
  };
  layout?: {
    spacing?: string;
  };
}
```

### 型アサーションの適切な使用

型アサーション(`as`)は最小限にし、使用する場合は理由をコメントで明示します。

#### ❌ 悪い例

```typescript
// 理由なく型アサーション
const data = response as User;
const value = obj as any; // 特に悪い
```

#### ✅ 良い例

```typescript
// 型ガードで検証してから使用
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'username' in value
  );
}

if (isUser(response)) {
  const data = response; // 型安全
}

// やむを得ない場合は理由をコメント
const data = response as User; // API契約上、必ずUser型が返る
```

### 未使用パラメータの扱い

スタブ関数や将来の実装のための未使用パラメータは`_`プレフィックスで明示します。

#### ❌ 悪い例

```typescript
// ESLint警告が出るが無視
export const getUserById = async (id: string) => {
  throw new Error('Not implemented');
};
```

#### ✅ 良い例

```typescript
// _プレフィックスで意図的な未使用を明示
export const getUserById = async (_id: string) => {
  throw new Error('Not implemented');
};

// 実装時は_を削除
export const getUserById = async (id: string) => {
  return await collection.findOne({ _id: new ObjectId(id) });
};
```

## まとめ

このガイドラインに従うことで：

- ✅ セキュアなコード
- ✅ 保守しやすいコード
- ✅ テストしやすいコード
- ✅ パフォーマンスの良いコード
- ✅ **型安全なコード** (2025年10月8日追加)

を実現できます。

### 最新の改善 (2025年10月8日)

- **`any`キャスト**: 8箇所以上 → 0箇所 (100%削除)
- **Next.js 15対応**: 全ルートハンドラーでPromise型params対応完了
- **型定義統合**: 重複型定義を解消、単一ソースから参照
- **ESLint警告**: 30+ → 15 (50%削減)

詳細は `REFACTORING_COMPLETE.md` を参照してください。
