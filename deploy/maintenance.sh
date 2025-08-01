#!/bin/bash

# メンテナンススクリプト

APP_NAME="test-website"
DEPLOY_PATH="/var/www/${APP_NAME}"
LOG_PATH="/var/log/${APP_NAME}"

case "$1" in
    "status")
        echo "=== アプリケーション状態 ==="
        pm2 status
        echo ""
        echo "=== システムリソース ==="
        df -h $DEPLOY_PATH
        free -h
        ;;
    
    "logs")
        echo "=== アプリケーションログ ==="
        pm2 logs $APP_NAME --lines ${2:-50}
        ;;
    
    "restart")
        echo "=== アプリケーション再起動 ==="
        pm2 restart $APP_NAME
        ;;
    
    "stop")
        echo "=== アプリケーション停止 ==="
        pm2 stop $APP_NAME
        ;;
    
    "start")
        echo "=== アプリケーション開始 ==="
        pm2 start $APP_NAME
        ;;
    
    "update")
        echo "=== アプリケーション更新 ==="
        cd $DEPLOY_PATH
        git pull origin master
        pnpm install --frozen-lockfile
        pnpm run build
        pm2 restart $APP_NAME
        ;;
    
    "backup")
        BACKUP_DIR="/var/backups/${APP_NAME}/manual-$(date +%Y%m%d-%H%M%S)"
        echo "=== データベースバックアップ ==="
        echo "バックアップ先: $BACKUP_DIR"
        mkdir -p $BACKUP_DIR
        
        # MongoDB バックアップ（mongodumpが利用可能な場合）
        if command -v mongodump &> /dev/null; then
            mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb"
            echo "MongoDBバックアップ完了"
        else
            echo "警告: mongodump が見つかりません"
        fi
        
        # ファイルバックアップ
        cp -r $DEPLOY_PATH/public/uploads $BACKUP_DIR/uploads 2>/dev/null || echo "アップロードファイルなし"
        echo "ファイルバックアップ完了"
        ;;
    
    "cleanup")
        echo "=== ログクリーンアップ ==="
        pm2 flush $APP_NAME
        find $LOG_PATH -name "*.log" -mtime +7 -delete
        echo "古いログファイルを削除しました"
        
        echo "=== 一時ファイルクリーンアップ ==="
        rm -rf /tmp/next-*
        rm -rf $DEPLOY_PATH/.next/cache/*
        echo "一時ファイルを削除しました"
        ;;
    
    "health")
        echo "=== ヘルスチェック ==="
        
        # プロセス確認
        if pm2 list | grep -q "${APP_NAME}.*online"; then
            echo "✓ アプリケーション: 実行中"
        else
            echo "✗ アプリケーション: 停止"
        fi
        
        # ポート確認
        if netstat -tuln | grep -q ":3000 "; then
            echo "✓ ポート3000: リスニング中"
        else
            echo "✗ ポート3000: 利用不可"
        fi
        
        # HTTP応答確認
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
            echo "✓ HTTP応答: 正常"
        else
            echo "✗ HTTP応答: エラー"
        fi
        
        # ディスク容量確認
        DISK_USAGE=$(df $DEPLOY_PATH | tail -1 | awk '{print $5}' | sed 's/%//')
        if [ $DISK_USAGE -lt 80 ]; then
            echo "✓ ディスク使用量: ${DISK_USAGE}%"
        else
            echo "⚠ ディスク使用量: ${DISK_USAGE}% (警告)"
        fi
        ;;
    
    *)
        echo "使用方法: $0 {status|logs|restart|stop|start|update|backup|cleanup|health}"
        echo ""
        echo "コマンド説明:"
        echo "  status  - アプリケーションとシステムの状態を表示"
        echo "  logs    - アプリケーションログを表示 (オプション: 行数)"
        echo "  restart - アプリケーションを再起動"
        echo "  stop    - アプリケーションを停止"
        echo "  start   - アプリケーションを開始"
        echo "  update  - GitリポジトリからコードをプルしてAP更新"
        echo "  backup  - データベースとファイルをバックアップ"
        echo "  cleanup - ログと一時ファイルをクリーンアップ"
        echo "  health  - アプリケーションのヘルスチェック"
        exit 1
        ;;
esac
