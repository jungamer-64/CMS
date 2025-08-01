# Test Website

Next.js 15とMongoDBを使用した### 3. 環境変数の設定

`.env`ファイルを作成（または既存のファイルを更新）：

```bash
# MongoDB接続文字列
MONGODB_URI=mongodb://localhost:27017/test-website
MONGODB_DB=test-website

# JWT秘密鍵
JWT_SECRET=your-secret-key-here

# API設定（オプション）
API_KEYS_DATA={"keys":[]}
DEFAULT_API_KEY=default-test-key

# 管理者設定
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
ADMIN_EMAIL=admin@example.com
```。pnpmパッケージマネージャーで最適化されています。

## 🚀 特徴

- **Next.js 15** - 最新のReact フレームワーク
- **Turbopack** - 超高速バンドラー（Webpackの最大10倍高速）
- **TypeScript** - 型安全性の確保
- **MongoDB** - NoSQLデータベース
- **Tailwind CSS** - ユーティリティファーストCSS
- **認証システム** - JWT認証
- **管理者パネル** - 投稿・ユーザー・メディア管理
- **レスポンシブ** - モバイルファースト

## 📋 必要な環境

- **Node.js** >= 18.17.0
- **pnpm** >= 8.0.0
- **MongoDB** データベース

## 🛠 セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd test-website
```

### 2. 依存関係のインストール

```bash
# pnpmのインストール（npmを使わずに直接インストール）
curl -fsSL https://get.pnpm.io/install.sh | sh -

# または、corepackが利用可能な場合
corepack enable
corepack prepare pnpm@latest --activate

# 依存関係をインストール
pnpm install
```

### 3. 環境変数の設定

`.env`ファイルを作成：

```bash
# MongoDB接続文字列
MONGODB_URI=mongodb://localhost:27017/test-website

# JWT秘密鍵
JWT_SECRET=your-secret-key-here

# 管理者設定
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
ADMIN_EMAIL=admin@example.com
```

### 4. 開発サーバーの起動

```bash
# 開発サーバー起動（Turbopack使用 - デフォルト）
pnpm dev

# 従来のWebpack使用
pnpm dev:webpack

# 明示的にTurbopack使用
pnpm dev:turbo
```

[http://localhost:3000](http://localhost:3000)でアプリケーションにアクセスできます。

**🚀 Turbopack について**
- このプロジェクトではTurbopackがデフォルトで有効化されています
- Webpackと比較して最大10倍高速な開発体験を提供
- Hot Module Replacement (HMR) が大幅に高速化

## 📝 利用可能なスクリプト

```bash
# 開発サーバー
pnpm dev              # Turbopack使用（高速）
pnpm dev:webpack      # 従来のWebpack使用
pnpm dev:turbo        # 明示的にTurbopack使用

# ビルド
pnpm build            # プロダクションビルド
pnpm start            # プロダクションサーバー起動

# 品質管理
pnpm lint             # ESLintチェック
pnpm lint:fix         # ESLint自動修正
pnpm type-check       # TypeScript型チェック

# ユーティリティ
pnpm clean            # ビルドファイル削除
pnpm create-user      # 初期ユーザー作成
pnpm list-users       # ユーザー一覧表示
pnpm convert-posts-media  # メディア変換スクリプト
```

## 🏗 プロジェクト構造

```
test-website/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── lib/               # ユーティリティ・ライブラリ
│   ├── components/        # Reactコンポーネント
│   ├── admin/             # 管理者パネル
│   └── ...
├── scripts/               # 管理スクリプト
├── public/                # 静的ファイル
├── pnpm-workspace.yaml    # pnpmワークスペース設定
├── .npmrc                 # pnpm設定
└── ...
```

## 🔧 開発ガイド

### pnpmの利点

- **高速インストール** - npmより最大2倍高速
- **ディスク効率** - シンボリックリンクでディスク使用量削減
- **厳密な依存関係** - phantom dependenciesを防止
- **monorepo対応** - ワークスペース機能

### 型安全性

```bash
# 型チェック実行
pnpm type-check

# 型エラーがある場合の修正
pnpm lint:fix
```

### スクリプト実行

```bash
# tsxを使用した高速TypeScript実行
pnpm create-user
pnpm list-users
pnpm convert-posts-media

# ドライラン（変更確認のみ）
pnpm convert-posts-media -- --dry-run
```

## 🚀 デプロイ

### Vercel（推奨）

```bash
# Vercel CLI使用
npx vercel

# 環境変数の設定
vercel env add MONGODB_URI
vercel env add JWT_SECRET
```

### その他のプラットフォーム

1. プロダクションビルド: `pnpm build`
2. 環境変数の設定
3. `pnpm start`で起動

## 📚 技術スタック

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **認証**: JWT, bcryptjs
- **開発ツール**: pnpm, tsx, ESLint, TypeScript
- **Deployment**: Vercel（推奨）

## 🤝 コントリビューション

1. フォーク
2. フィーチャーブランチ作成: `git checkout -b feature/amazing-feature`
3. コミット: `git commit -m 'Add amazing feature'`
4. プッシュ: `git push origin feature/amazing-feature`
5. プルリクエスト作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
