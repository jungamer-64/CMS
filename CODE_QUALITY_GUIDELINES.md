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

## まとめ

このガイドラインに従うことで：

- ✅ セキュアなコード
- ✅ 保守しやすいコード
- ✅ テストしやすいコード
- ✅ パフォーマンスの良いコード

を実現できます。
