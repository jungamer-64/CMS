#!/bin/bash

# GMO CorelServer用デプロイスクリプト
# CorelServerは共用サーバーのため、制限された環境での動作を考慮

set -e

ENVIRONMENT=${1:-production}
APP_NAME="jgm-blog"
DEPLOY_PATH="/home/rebelor/domains/jungamer.uk/public_html"
BACKUP_PATH="/home/rebelor/domains/jungamer.uk/private_html/backup"
REPO_URL="https://github.com/jungamer-64/test-website.git"

echo "=== GMO CorelServer ${APP_NAME} デプロイ開始 (${ENVIRONMENT}) ==="

# CorelServerの環境確認
echo "CorelServer環境を確認中..."
uname -a
echo "ホームディレクトリ: $HOME"
echo "現在のディレクトリ: $(pwd)"

# バックアップディレクトリの作成
mkdir -p $BACKUP_PATH

# 既存のアプリケーションをバックアップ
if [ -d "$DEPLOY_PATH" ]; then
    echo "既存のアプリケーションをバックアップ中..."
    cp -r $DEPLOY_PATH $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S)
    
    # 古いバックアップを削除（3個まで保持）
    find $BACKUP_PATH -maxdepth 1 -name "backup-*" -type d | sort -r | tail -n +4 | xargs rm -rf
fi

# デプロイディレクトリの準備
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH

# Gitリポジトリのクローンまたは更新
if [ -d ".git" ]; then
    echo "リポジトリを更新中..."
    git fetch --all
    git reset --hard origin/master
    git clean -fd
else
    echo "リポジトリをクローン中..."
    git clone $REPO_URL .
fi

# 環境変数ファイルのコピー
echo "環境変数ファイルを設定中..."
if [ -f "$HOME/.env.${ENVIRONMENT}" ]; then
    cp $HOME/.env.${ENVIRONMENT} .env
    echo "環境変数ファイルをコピーしました: .env.${ENVIRONMENT}"
else
    echo "警告: 環境変数ファイルが見つかりません: $HOME/.env.${ENVIRONMENT}"
    echo ".envファイルを手動で作成してください"
fi

# CorelServer用Next.js設定ファイルのコピー
echo "Next.js設定ファイルを設定中..."
if [ -f "deploy/next.config.coreserver.ts" ]; then
    cp deploy/next.config.coreserver.ts next.config.ts
    echo "CorelServer用next.config.tsをコピーしました"
else
    echo "警告: deploy/next.config.coreserver.ts が見つかりません"
fi

# Node.jsバージョン確認
echo "Node.js環境を確認中..."
if command -v node &> /dev/null; then
    echo "Node.js version: $(node --version)"
    if command -v npm &> /dev/null; then
        echo "npm version: $(npm --version)"
    fi
else
    echo "エラー: Node.jsがインストールされていません"
    echo "CorelServerでNode.jsを有効化してください"
    exit 1
fi

# pnpmのインストール（必要な場合）
if ! command -v pnpm &> /dev/null; then
    echo "pnpmをインストール中..."
    npm install -g pnpm
fi

# 依存関係のインストール
echo "依存関係をインストール中..."
pnpm install --frozen-lockfile

# アプリケーションのビルド
echo "アプリケーションをビルド中..."
pnpm run build

# Next.jsスタンドアロンビルドの確認
if [ -d ".next/standalone" ]; then
    echo "スタンドアロンビルドが生成されました"
    
    # スタンドアロン用のサーバー起動スクリプト作成
    cat > server.js << 'EOF'
#!/usr/bin/env node

const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

// Change to standalone directory and start server
process.chdir('.next/standalone')

// Start the standalone server
require('./server.js')
EOF

    # publicフォルダとstaticファイルをコピー
    echo "静的ファイルをコピー中..."
    if [ -d "public" ]; then
        cp -r public .next/standalone/
    fi
    if [ -d ".next/static" ]; then
        cp -r .next/static .next/standalone/.next/
    fi
    
else
    echo "通常のNext.jsビルドを使用"
    
    # 通常のNext.jsサーバー起動スクリプト
    cat > server.js << 'EOF'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
EOF
fi

# アプリケーションの起動/再起動（CorelServer環境に応じて調整）
echo "アプリケーションの起動設定..."

# CorelServerでのプロセス管理（supervisorが利用可能な場合）
if command -v supervisorctl &> /dev/null; then
    echo "Supervisorでプロセス管理..."
    
    # Supervisor設定ファイルの作成
    cat > ${APP_NAME}.conf << EOF
[program:${APP_NAME}]
directory=${DEPLOY_PATH}
command=node server.js
autostart=true
autorestart=true
stderr_logfile=/home/rebelor/domains/jungamer.uk/logs/${APP_NAME}.err.log
stdout_logfile=/home/rebelor/domains/jungamer.uk/logs/${APP_NAME}.out.log
environment=NODE_ENV="${ENVIRONMENT}",PORT="3000"
EOF
    
    # ログディレクトリの作成
    mkdir -p /home/rebelor/domains/jungamer.uk/logs
    
    echo "Supervisor設定ファイルを作成しました: ${APP_NAME}.conf"
    echo "管理者にSupervisor設定の追加を依頼してください"
    
else
    echo "手動でNode.jsプロセスを起動してください:"
    echo "nohup node server.js > ${APP_NAME}.log 2>&1 &"
fi

# .htaccessファイルの作成（Apache環境の場合 - LiteSpeedでは不要）
echo "Apache設定ファイルを作成中..."
cat > .htaccess << 'EOF'
RewriteEngine On

# Next.js static files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} ^/_next/static/
RewriteRule ^(.*)$ /.next/static/$1 [L]

# Next.js API routes and pages - すべてをNode.jsサーバーにプロキシ
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Prevent access to sensitive files
<Files ~ "^\.env">
    Order allow,deny
    Deny from all
</Files>

<Files ~ "^\.git">
    Order allow,deny
    Deny from all
</Files>

<Files ~ "node_modules">
    Order allow,deny
    Deny from all
</Files>
EOF

echo "=== CorelServerデプロイ完了 ==="
echo "アプリケーション: ${APP_NAME}"
echo "環境: ${ENVIRONMENT}"
echo "パス: ${DEPLOY_PATH}"
echo ""
echo "次のステップ:"
echo "1. Node.jsプロセスを起動してください"
echo "2. CorelServerの管理画面でドメイン設定を確認してください"
echo "3. CloudflareでSSL設定が有効であることを確認してください"
