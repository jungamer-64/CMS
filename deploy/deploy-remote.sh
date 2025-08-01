#!/bin/bash

# ローカルからサーバーへのデプロイスクリプト
# Usage: ./deploy-remote.sh production your-server.com

set -e

ENVIRONMENT=${1:-production}
SERVER_HOST=${2:-your-server.com}
SERVER_USER=${3:-ubuntu}
APP_NAME="test-website"

echo "=== リモートデプロイ開始 ==="
echo "環境: $ENVIRONMENT"
echo "サーバー: $SERVER_HOST"
echo "ユーザー: $SERVER_USER"

# SSHキーの確認
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "エラー: SSHキーが見つかりません"
    echo "ssh-keygen -t rsa -b 4096 -C \"your-email@example.com\" でキーを生成してください"
    exit 1
fi

# サーバーの疎通確認
echo "サーバーへの接続確認中..."
ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH接続成功'"

# デプロイスクリプトのアップロード
echo "デプロイスクリプトをアップロード中..."
scp deploy/*.sh $SERVER_USER@$SERVER_HOST:/tmp/

# 環境変数ファイルのアップロード（存在する場合）
if [ -f "deploy/.env.${ENVIRONMENT}" ]; then
    echo "環境変数ファイルをアップロード中..."
    ssh $SERVER_USER@$SERVER_HOST "sudo mkdir -p /etc/${APP_NAME}"
    scp deploy/.env.${ENVIRONMENT} $SERVER_USER@$SERVER_HOST:/tmp/
    ssh $SERVER_USER@$SERVER_HOST "sudo mv /tmp/.env.${ENVIRONMENT} /etc/${APP_NAME}/"
else
    echo "警告: 環境変数ファイル deploy/.env.${ENVIRONMENT} が見つかりません"
fi

# サーバーでのセットアップ実行（初回のみ）
read -p "初回セットアップを実行しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "サーバーセットアップを実行中..."
    ssh $SERVER_USER@$SERVER_HOST "chmod +x /tmp/server-setup.sh && sudo /tmp/server-setup.sh"
fi

# アプリケーションのデプロイ
echo "アプリケーションデプロイを実行中..."
ssh $SERVER_USER@$SERVER_HOST "chmod +x /tmp/deploy.sh && /tmp/deploy.sh $ENVIRONMENT"

# デプロイ後の確認
echo "デプロイ状況を確認中..."
ssh $SERVER_USER@$SERVER_HOST "pm2 status && pm2 logs $APP_NAME --lines 10"

echo ""
echo "=== デプロイ完了 ==="
echo "アプリケーションURL: https://$SERVER_HOST"
echo "管理画面: https://$SERVER_HOST/admin"
echo ""
echo "便利なコマンド:"
echo "  ログ確認: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs $APP_NAME'"
echo "  再起動: ssh $SERVER_USER@$SERVER_HOST 'pm2 restart $APP_NAME'"
echo "  停止: ssh $SERVER_USER@$SERVER_HOST 'pm2 stop $APP_NAME'"
