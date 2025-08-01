# TypeScript Deployment Scripts

CoreServer向けの型安全なデプロイメントシステムです。

## 📁 ファイル構成

```
deploy/
├── types.ts                    # TypeScript型定義
├── config.ts                   # 設定管理
├── utils.ts                    # ユーティリティ関数
├── deploy-coreserver.ts        # メインデプロイスクリプト
├── maintenance-coreserver.ts   # メンテナンススクリプト
├── package.json               # Node.js設定
├── tsconfig.json              # TypeScript設定
└── README-typescript.md       # このファイル
```

## 🚀 使用方法

### 1. 依存関係のインストール

```bash
cd deploy
npm install
```

### 2. TypeScriptコンパイル

```bash
npm run build
```

### 3. デプロイメント実行

```bash
# 本番環境へのデプロイ
node deploy-coreserver.js production

# ステージング環境へのデプロイ
node deploy-coreserver.js staging

# 開発環境へのデプロイ
node deploy-coreserver.js development
```

### 4. メンテナンス操作

```bash
# サーバー起動
node maintenance-coreserver.js start production

# サーバー停止
node maintenance-coreserver.js stop production

# サーバー再起動
node maintenance-coreserver.js restart production

# ステータス確認
node maintenance-coreserver.js status production

# ログ表示
node maintenance-coreserver.js logs production

# バックアップ作成
node maintenance-coreserver.js backup production

# クリーンアップ
node maintenance-coreserver.js cleanup production

# アプリケーション更新
node maintenance-coreserver.js update production
```

## 🔧 型安全性の特徴

### 1. 型定義ファイル (types.ts)

- `Environment`: 環境タイプ（development, staging, production）
- `DeployConfig`: デプロイ設定
- `CoreServerConfig`: CoreServer固有設定
- `SystemStatus`: システム状態
- `ProcessInfo`: プロセス情報
- `MaintenanceOperation`: メンテナンス操作

### 2. 設定管理 (config.ts)

- 環境別設定の型安全な管理
- 環境変数の検証とロード
- CoreServer固有の設定

### 3. ユーティリティ (utils.ts)

- コマンド実行の型安全なラッパー
- システム状態取得
- プロセス管理
- エラーハンドリング

## 📦 従来のShellスクリプトからの移行

### 従来の問題点
- 型チェックなし
- エラーハンドリングが不十分
- 設定の一元管理が困難
- テストが困難

### TypeScript版の利点
- ✅ コンパイル時型チェック
- ✅ 包括的なエラーハンドリング
- ✅ 設定の型安全な管理
- ✅ モジュラー設計
- ✅ テスト可能
- ✅ IDEサポート

## 🔍 開発とデバッグ

### TypeScriptコードの検証

```bash
# 型チェックのみ
npm run type-check

# Linting
npm run lint

# 全体ビルド
npm run build
```

### デバッグ

```bash
# サイレントモードを無効にしてデバッグ情報を表示
DEBUG=true node deploy-coreserver.js production
```

## ⚙️ 設定

### 環境変数

各環境用の`.env`ファイルを`$HOME`ディレクトリに配置：

- `~/.env.development`
- `~/.env.staging` 
- `~/.env.production`

### CoreServer設定

`config.ts`でCoreServer固有の設定を管理：

```typescript
export const CORESERVER_CONFIG = {
  serverNumber: 'v2008',
  username: 'rebelor',
  serverHost: 'v2008.coreserver.jp',
  sshKeyPath: '~/.ssh/jgm_rsa',
  port: 3000
};
```

## 🛠️ トラブルシューティング

### よくある問題

1. **型エラー**: `npm run type-check`で事前確認
2. **実行権限**: `.js`ファイルに実行権限を付与
3. **SSH接続**: SSH鍵の設定を確認
4. **Node.js版本**: Node.js 18以上が必要

### ログの確認

```bash
# メンテナンススクリプトでログ確認
node maintenance-coreserver.js logs production 100

# フォローモード
node maintenance-coreserver.js logs production --follow
```

## 🔄 継続的インテグレーション

### 推奨ワークフロー

1. コード変更
2. `npm run type-check` - 型チェック
3. `npm run lint` - コード品質チェック
4. `npm run build` - ビルド
5. テスト実行（必要に応じて）
6. デプロイ実行

## 📝 今後の拡張

- [ ] ユニットテストの追加
- [ ] CI/CDパイプラインの統合
- [ ] Docker対応
- [ ] 詳細なログ機能
- [ ] WebUIの追加

---

**注意**: このTypeScriptバージョンは、従来のshellスクリプトを完全に置き換える設計になっています。型安全性と保守性を重視した実装です。
