#!/bin/bash

# デプロイスクリプトに実行権限を付与

echo "=== デプロイスクリプトの実行権限設定 ==="

# Linuxスクリプトに実行権限を付与
chmod +x deploy/server-setup.sh
chmod +x deploy/deploy.sh
chmod +x deploy/deploy-remote.sh
chmod +x deploy/maintenance.sh

echo "実行権限を付与しました:"
ls -la deploy/*.sh

echo ""
echo "=== 使用方法 ==="
echo "1. サーバー初期設定:"
echo "   ./deploy/deploy-remote.sh production your-server.com"
echo ""
echo "2. メンテナンス:"
echo "   ssh user@your-server.com './maintenance.sh status'"
echo ""
echo "注意: SSL証明書はCloudflare経由で設定済みです"
