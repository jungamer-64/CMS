#!/bin/bash

# Next.js アプリケーションデプロイスクリプト
# Usage: ./deploy.sh [production|staging]

set -e  # エラー時に停止

ENVIRONMENT=${1:-production}
APP_NAME="test-website"
DEPLOY_PATH="/var/www/${APP_NAME}"
BACKUP_PATH="/var/backups/${APP_NAME}"
REPO_URL="https://github.com/jungamer-64/test-website.git"

echo "=== ${APP_NAME} デプロイ開始 (${ENVIRONMENT}) ==="

# バックアップディレクトリの作成
sudo mkdir -p $BACKUP_PATH

# 既存のアプリケーションをバックアップ
if [ -d "$DEPLOY_PATH" ]; then
    echo "既存のアプリケーションをバックアップ中..."
    sudo cp -r $DEPLOY_PATH $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S)
    
    # 古いバックアップを削除（5個まで保持）
    sudo find $BACKUP_PATH -maxdepth 1 -name "backup-*" -type d | sort -r | tail -n +6 | xargs sudo rm -rf
fi

# デプロイディレクトリの準備
sudo mkdir -p $DEPLOY_PATH
sudo chown -R $USER:$USER $DEPLOY_PATH

# Gitリポジトリのクローンまたは更新
if [ -d "$DEPLOY_PATH/.git" ]; then
    echo "リポジトリを更新中..."
    cd $DEPLOY_PATH
    git fetch --all
    git reset --hard origin/master
    git clean -fd
else
    echo "リポジトリをクローン中..."
    git clone $REPO_URL $DEPLOY_PATH
    cd $DEPLOY_PATH
fi

# 環境変数ファイルのコピー
echo "環境変数ファイルを設定中..."
if [ -f "/etc/${APP_NAME}/.env.${ENVIRONMENT}" ]; then
    sudo cp /etc/${APP_NAME}/.env.${ENVIRONMENT} $DEPLOY_PATH/.env
    echo "環境変数ファイルをコピーしました: .env.${ENVIRONMENT}"
else
    echo "警告: 環境変数ファイルが見つかりません: /etc/${APP_NAME}/.env.${ENVIRONMENT}"
    echo "手動で .env ファイルを作成してください"
fi

# 依存関係のインストール
echo "依存関係をインストール中..."
pnpm install --frozen-lockfile

# アプリケーションのビルド
echo "アプリケーションをビルド中..."
pnpm run build

# PM2の設定
echo "PM2設定ファイルを作成中..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'server.js',
    cwd: '${DEPLOY_PATH}',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '${ENVIRONMENT}',
      PORT: 3000
    },
    error_file: '/var/log/${APP_NAME}/error.log',
    out_file: '/var/log/${APP_NAME}/out.log',
    log_file: '/var/log/${APP_NAME}/combined.log',
    time: true
  }]
};
EOF

# ログディレクトリの作成
sudo mkdir -p /var/log/${APP_NAME}
sudo chown -R $USER:$USER /var/log/${APP_NAME}

# PM2でアプリケーションを起動/再起動
echo "アプリケーションを起動/再起動中..."
if pm2 list | grep -q "${APP_NAME}"; then
    pm2 restart ${APP_NAME}
else
    pm2 start ecosystem.config.js
fi

# PM2の設定を保存
pm2 save
pm2 startup

echo "=== デプロイ完了 ==="
echo "アプリケーション: ${APP_NAME}"
echo "環境: ${ENVIRONMENT}"
echo "パス: ${DEPLOY_PATH}"
echo "ステータス確認: pm2 status"
echo "ログ確認: pm2 logs ${APP_NAME}"
