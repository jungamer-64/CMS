# CI/CD & 監視システムセットアップ完了報告

## 📋 概要

このドキュメントは、Next.js 15 CMS プロジェクトに実装したCI/CDパイプラインと統一監視・ロギングシステムの詳細を記録します。

**実装日**: 2025年1月
**対象**: Next.js 15.4.5, TypeScript 5.9.3, pnpm 9.15.0

---

## 🎯 実装内容

### 1. 統一ロギングシステム

#### 📁 `app/lib/core/logger.ts` (新規作成)

**主な機能:**
- ログレベル管理（error, warn, info, debug）
- 構造化されたJSON形式のログ出力
- コンテキスト/メタデータのサポート
- 開発環境と本番環境での適切なログ出力
- 子ロガーの作成（コンテキスト継承）
- パフォーマンス測定ヘルパー
- 外部ロギングサービス統合ポイント（Sentry, Datadog等）

**使用例:**
```typescript
import { logger, createLogger, PerformanceLogger } from '@/app/lib/core/logger';

// 基本的なログ
logger.info('ユーザーがログインしました', { userId: '123' });
logger.error('データベースエラーが発生しました', { error: err });

// モジュール別ロガー
const authLogger = createLogger('auth', { module: 'authentication' });
authLogger.info('パスワードを変更しました');

// パフォーマンス測定
const perfLogger = new PerformanceLogger('database-query', { queryType: 'SELECT' });
// ... 処理 ...
perfLogger.end({ rowCount: 100 });
```

**ログレベルの優先順位:**
1. **ERROR** (最高) - システムの動作に影響する問題
2. **WARN** - 問題があるが動作は継続
3. **INFO** - 通常の動作ログ
4. **DEBUG** (最低) - 開発時の詳細情報

**環境変数:**
- `LOG_LEVEL`: ログレベルを設定（error, warn, info, debug）
- `NODE_ENV`: development では見やすい形式、production ではJSON形式で出力

#### 🔄 `app/lib/core/error-handler.ts` (更新)

**変更内容:**
- `logger` モジュールの統合
- `logError` 関数を更新して `createLogger` を使用
- エラー重要度に応じた適切なログレベルの選択
- コンテキスト情報の構造化

**Before (基本的なconsole.error):**
```typescript
function logError(error: HandledError, severity: ErrorSeverity, context?: ErrorContext): void {
  const logData = { severity, message: error.message, code: error.code };
  console.error('[Error Handler]', logData);
}
```

**After (統一ロガー使用):**
```typescript
function logError(error: HandledError, severity: ErrorSeverity, context?: ErrorContext): void {
  const errorLogger = createLogger('error-handler', {
    location: context?.location,
    userId: context?.userId,
  });

  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      errorLogger.error(error.message, logContext, error.originalError);
      break;
    case ErrorSeverity.WARNING:
      errorLogger.warn(error.message, logContext);
      break;
  }
}
```

---

### 2. CI/CDパイプライン

#### 📁 `.github/workflows/ci.yml` (新規作成)

**トリガー:**
- `push` イベント: `main`, `develop` ブランチ
- `pull_request` イベント: `main`, `develop` ブランチへのPR

**ジョブ:**

##### 1. **Test** ジョブ
- Node.js 18.x と 20.x のマトリックスビルド
- pnpm でのキャッシュ付き依存関係インストール
- `pnpm test` によるテスト実行
- Codecov へのカバレッジレポートアップロード（Node.js 20.x のみ）

##### 2. **Lint** ジョブ
- ESLint によるコード品質チェック
- `pnpm lint` の実行

##### 3. **Type Check** ジョブ
- TypeScript の型チェック
- `pnpm type-check` の実行

##### 4. **Format Check** ジョブ
- コードフォーマットのチェック（オプション）

**特徴:**
- pnpm のキャッシュで高速化
- 並列実行による時間短縮
- frozen-lockfile での厳密な依存関係管理

#### 📁 `.github/workflows/build.yml` (新規作成)

**トリガー:**
- `push` イベント: `main`, `develop` ブランチ
- `pull_request` イベント: `main`, `develop` ブランチへのPR

**ジョブ:**

##### **Build** ジョブ
- 本番環境ビルドの検証
- `pnpm build` の実行
- `.next` ディレクトリの存在確認
- ビルド成果物のアップロード（7日間保持）

**特徴:**
- 本番環境相当のビルドチェック
- ビルド成果物の保存と共有

#### 📁 `.github/workflows/security.yml` (新規作成)

**トリガー:**
- `push` イベント: `main`, `develop` ブランチ
- `pull_request` イベント: `main`, `develop` ブランチへのPR
- `schedule`: 毎週月曜日の午前0時（UTC）に実行

**ジョブ:**

##### 1. **Dependency Scan** ジョブ
- `pnpm audit` による依存関係の脆弱性スキャン
- 古いパッケージのチェック

##### 2. **Code Security** ジョブ
- GitHub CodeQL によるコードセキュリティ分析
- JavaScript/TypeScript のセキュリティ脆弱性検出

##### 3. **Secrets Scan** ジョブ
- Gitleaks による秘密情報の漏洩チェック
- コミット履歴全体のスキャン

**特徴:**
- 定期的な自動セキュリティスキャン
- 継続的なセキュリティ監視

---

### 3. 監視システム

#### 📁 `app/api/health/route.ts` (新規作成)

**エンドポイント:** `GET /api/health`

**機能:**
- システムの稼働状況を監視
- データベース接続チェック（ping + レイテンシー測定）
- メモリ使用状況チェック（警告: 75%、危機: 90%）
- 環境情報の提供

**レスポンス例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "latency": 25
    },
    "memory": {
      "status": "ok",
      "used": 512,
      "total": 2048,
      "percentage": 25.0
    },
    "environment": {
      "nodeEnv": "production",
      "nodeVersion": "v20.11.0"
    }
  }
}
```

**ステータス:**
- `healthy` (200): すべてのチェックが正常
- `degraded` (200): 一部のチェックで警告
- `unhealthy` (503): 重大な問題が発生

**使用例:**
```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# 監視ツールとの統合
# - Kubernetes liveness/readiness probe
# - Uptime monitoring services
# - Load balancer health checks
```

#### 📁 `app/api/metrics/route.ts` (新規作成)

**エンドポイント:** `GET /api/metrics`

**機能:**
- システムメトリクスの収集
- メモリ使用量（heap, RSS, external）
- CPU使用率（user, system）
- プロセス情報（PID, Node.jsバージョン、プラットフォーム）
- 環境情報

**認証:**
- 開発環境: 認証なしでアクセス可能
- 本番環境: `Authorization: Bearer <METRICS_TOKEN>` ヘッダーが必要

**レスポンス例:**
```json
{
  "timestamp": "2025-01-21T10:30:00.000Z",
  "system": {
    "uptime": 3600,
    "memory": {
      "heapUsed": 512,
      "heapTotal": 1024,
      "rss": 800,
      "external": 50
    },
    "cpu": {
      "user": 5000,
      "system": 2000
    }
  },
  "process": {
    "pid": 12345,
    "nodeVersion": "v20.11.0",
    "platform": "linux",
    "arch": "x64"
  },
  "environment": {
    "nodeEnv": "production"
  }
}
```

**使用例:**
```bash
# 開発環境
curl http://localhost:3000/api/metrics

# 本番環境
curl -H "Authorization: Bearer your-secret-token" https://example.com/api/metrics

# 監視ツールとの統合
# - Prometheus (カスタムエクスポーター)
# - Datadog (カスタムメトリクス)
# - Grafana (データソース)
```

---

## 🔧 セットアップ手順

### 1. ロギングシステムの使用

#### 基本的な使用方法

```typescript
import { logger } from '@/app/lib/core/logger';

// 情報ログ
logger.info('アプリケーションが起動しました', {
  port: 3000,
  environment: process.env.NODE_ENV
});

// エラーログ
try {
  await riskyOperation();
} catch (error) {
  logger.error('操作が失敗しました', { operation: 'riskyOperation' }, error);
}
```

#### モジュール別ロガー

```typescript
import { createLogger } from '@/app/lib/core/logger';

const dbLogger = createLogger('database');
dbLogger.info('接続が確立されました', { host: 'localhost', port: 27017 });
```

#### パフォーマンス測定

```typescript
import { PerformanceLogger } from '@/app/lib/core/logger';

async function fetchUsers() {
  const perfLogger = new PerformanceLogger('fetch-users', { endpoint: '/api/users' });
  
  try {
    const users = await db.collection('users').find().toArray();
    perfLogger.end({ count: users.length });
    return users;
  } catch (error) {
    perfLogger.error(error, { endpoint: '/api/users' });
    throw error;
  }
}
```

### 2. CI/CDパイプラインの設定

#### 必要なシークレット (GitHub Settings → Secrets)

1. **CODECOV_TOKEN** (オプション)
   - Codecov でのコードカバレッジレポート用
   - 取得方法: https://codecov.io/

2. **METRICS_TOKEN** (推奨)
   - 本番環境でのメトリクスエンドポイント認証用
   ```bash
   # ランダムトークン生成
   openssl rand -base64 32
   ```

#### ワークフローの有効化

1. GitHub リポジトリに `.github/workflows/` をプッシュ
2. GitHub の "Actions" タブで自動的に有効化
3. 次回のコミット/PRで自動実行

### 3. 監視システムの統合

#### ヘルスチェックエンドポイント

**Kubernetes liveness probe:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Docker Compose healthcheck:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### メトリクスエンドポイント

**環境変数の設定 (`.env.local`):**
```env
METRICS_TOKEN=your-secret-token-here
```

**Prometheus スクレイピング (カスタムエクスポーター必要):**
```yaml
scrape_configs:
  - job_name: 'nextjs-cms'
    metrics_path: '/api/metrics'
    bearer_token: 'your-secret-token'
    static_configs:
      - targets: ['cms.example.com']
```

---

## 📊 ログ出力例

### 開発環境

```
ℹ️  [2025-01-21T10:30:00.000Z] INFO: ユーザーがログインしました { userId: '123', username: 'admin' }
⚠️  [2025-01-21T10:30:05.000Z] WARN: メモリ使用量が高くなっています { percentage: 78.5, used: 1600, total: 2048 }
❌ [2025-01-21T10:30:10.000Z] ERROR: データベース接続エラー { location: '/api/posts', error: 'Connection timeout' }
    at connectToDatabase (database/connection.ts:45:12)
    at POST (api/posts/route.ts:20:8)
```

### 本番環境 (JSON形式)

```json
{"timestamp":"2025-01-21T10:30:00.000Z","level":"info","message":"ユーザーがログインしました","context":{"userId":"123","username":"admin"},"environment":"production","application":"CMS"}
{"timestamp":"2025-01-21T10:30:05.000Z","level":"warn","message":"メモリ使用量が高くなっています","context":{"percentage":78.5,"used":1600,"total":2048},"environment":"production","application":"CMS"}
{"timestamp":"2025-01-21T10:30:10.000Z","level":"error","message":"データベース接続エラー","context":{"location":"/api/posts"},"error":{"message":"Connection timeout","name":"Error","stack":"..."},"environment":"production","application":"CMS"}
```

---

## 🚀 今後の拡張

### ロギングシステム

1. **外部ロギングサービス統合**
   ```typescript
   import { ExternalLogTransport, logger } from '@/app/lib/core/logger';
   
   // Sentry、Datadog、Logtail等への送信
   const externalTransport = new ExternalLogTransport(
     process.env.LOG_ENDPOINT!,
     process.env.LOG_API_KEY
   );
   logger.addTransport(externalTransport);
   ```

2. **ログフィルタリング**
   - 機密情報の自動マスキング
   - 特定モジュールのログレベル個別設定

3. **ログローテーション**
   - ファイルログ出力の追加
   - 自動圧縮とアーカイブ

### CI/CDパイプライン

1. **デプロイメント自動化**
   - Vercel、AWS、Azure等への自動デプロイ
   - ステージング環境へのPRデプロイ

2. **パフォーマンステスト**
   - Lighthouse CI の統合
   - バンドルサイズの監視

3. **E2Eテスト**
   - Playwright による自動テスト
   - ビジュアルリグレッションテスト

### 監視システム

1. **アラート設定**
   - エラーレート閾値超過時の通知
   - レスポンスタイム劣化の検知

2. **ダッシュボード**
   - Grafana でのリアルタイム可視化
   - 履歴データの分析

3. **トレーシング**
   - OpenTelemetry の統合
   - 分散トレーシング

---

## ✅ チェックリスト

### セットアップ完了確認

- [x] `app/lib/core/logger.ts` が作成されている
- [x] `app/lib/core/error-handler.ts` が更新されている
- [x] `.github/workflows/ci.yml` が作成されている
- [x] `.github/workflows/build.yml` が作成されている
- [x] `.github/workflows/security.yml` が作成されている
- [x] `app/api/health/route.ts` が作成されている
- [x] `app/api/metrics/route.ts` が作成されている

### 動作確認

- [ ] `pnpm dev` でアプリケーションが起動する
- [ ] ログが適切に出力される
- [ ] `/api/health` にアクセスして正常なレスポンスが返る
- [ ] `/api/metrics` にアクセスしてメトリクスが取得できる
- [ ] GitHub Actions でCI/CDが実行される

### 本番環境設定

- [ ] `METRICS_TOKEN` 環境変数を設定
- [ ] ヘルスチェックエンドポイントを監視ツールに登録
- [ ] メトリクスエンドポイントを監視ツールに登録
- [ ] ログ出力先を設定（ファイル or 外部サービス）

---

## 📚 参考資料

### ロギング
- [Winston](https://github.com/winstonjs/winston) - Node.js のロギングライブラリ
- [Pino](https://github.com/pinojs/pino) - 高速JSONロガー
- [Sentry](https://sentry.io/) - エラー監視サービス

### CI/CD
- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [pnpm CI セットアップ](https://pnpm.io/continuous-integration)
- [Codecov](https://about.codecov.io/) - コードカバレッジ

### 監視
- [Prometheus](https://prometheus.io/) - メトリクス収集
- [Grafana](https://grafana.com/) - 可視化ダッシュボード
- [Datadog](https://www.datadoghq.com/) - 統合監視プラットフォーム

---

## 🎉 まとめ

このセットアップにより、以下が実現されました:

1. **統一ロギングシステム**
   - アプリケーション全体で一貫したログ出力
   - 構造化されたログで解析が容易
   - 開発と本番で最適化された出力形式

2. **自動化されたCI/CD**
   - コミット/PRごとの自動テスト
   - コード品質の継続的なチェック
   - セキュリティスキャンの定期実行

3. **包括的な監視**
   - ヘルスチェックによる稼働監視
   - システムメトリクスの収集
   - パフォーマンス測定の基盤

これらの機能により、開発効率の向上、品質の維持、運用の安定性が大幅に改善されます。
