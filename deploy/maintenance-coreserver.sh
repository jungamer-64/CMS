#!/bin/bash

# GMO CoreServer用メンテナンススクリプト

APP_NAME="jgm-blog"
DEPLOY_PATH="/home/rebelor/domains/jungamer.uk/public_html"
LOG_PATH="/home/rebelor/domains/jungamer.uk/logs"

case "$1" in
    "status")
        echo "=== CoreServer アプリケーション状態 ==="
        
        # Node.jsプロセス確認
        if pgrep -f "node.*server.js" > /dev/null; then
            echo "✓ Node.jsプロセス: 実行中"
            echo "プロセス詳細:"
            ps aux | grep "node.*server.js" | grep -v grep
        else
            echo "✗ Node.jsプロセス: 停止"
        fi
        
        # ディスク使用量
        echo ""
        echo "=== ディスク使用量 ==="
        df -h $DEPLOY_PATH 2>/dev/null || echo "アプリケーションディレクトリが見つかりません"
        
        # メモリ使用量
        echo ""
        echo "=== メモリ使用量 ==="
        free -h 2>/dev/null || echo "メモリ情報を取得できません"
        ;;
    
    "logs")
        echo "=== アプリケーションログ ==="
        LINES=${2:-50}
        
        if [ -f "$LOG_PATH/${APP_NAME}.log" ]; then
            tail -n $LINES "$LOG_PATH/${APP_NAME}.log"
        elif [ -f "$DEPLOY_PATH/${APP_NAME}.log" ]; then
            tail -n $LINES "$DEPLOY_PATH/${APP_NAME}.log"
        else
            echo "ログファイルが見つかりません"
            echo "利用可能なログファイル:"
            find $LOG_PATH $DEPLOY_PATH -name "*.log" -type f 2>/dev/null || echo "なし"
        fi
        ;;
    
    "restart")
        echo "=== アプリケーション再起動 ==="
        
        # Node.jsプロセスを停止
        echo "Node.jsプロセスを停止中..."
        pkill -f "node.*server.js" || echo "停止するプロセスがありません"
        sleep 2
        
        # アプリケーションを再起動
        echo "アプリケーションを起動中..."
        cd $DEPLOY_PATH
        
        # スタンドアロンビルドの確認
        if [ -f ".next/standalone/server.js" ]; then
            echo "スタンドアロンサーバーを起動中..."
            cd .next/standalone
            nohup node server.js > ../../${APP_NAME}.log 2>&1 &
            echo "スタンドアロンアプリケーションを起動しました（PID: $!）"
        elif [ -f "server.js" ]; then
            echo "カスタムサーバーを起動中..."
            nohup node server.js > ${APP_NAME}.log 2>&1 &
            echo "アプリケーションを起動しました（PID: $!）"
        else
            echo "エラー: server.js が見つかりません"
        fi
        ;;
    
    "stop")
        echo "=== アプリケーション停止 ==="
        pkill -f "node.*server.js"
        echo "Node.jsプロセスを停止しました"
        ;;
    
    "start")
        echo "=== アプリケーション開始 ==="
        cd $DEPLOY_PATH
        
        # スタンドアロンビルドの確認
        if [ -f ".next/standalone/server.js" ]; then
            echo "スタンドアロンサーバーを起動中..."
            cd .next/standalone
            nohup node server.js > ../../${APP_NAME}.log 2>&1 &
            echo "スタンドアロンアプリケーションを起動しました（PID: $!）"
        elif [ -f "server.js" ]; then
            echo "カスタムサーバーを起動中..."
            nohup node server.js > ${APP_NAME}.log 2>&1 &
            echo "アプリケーションを起動しました（PID: $!）"
        else
            echo "エラー: server.js が見つかりません"
            echo "デプロイを先に実行してください"
        fi
        ;;
    
    "update")
        echo "=== アプリケーション更新 ==="
        cd $DEPLOY_PATH
        
        echo "Gitリポジトリを更新中..."
        git pull origin master
        
        echo "依存関係を更新中..."
        if command -v pnpm &> /dev/null; then
            pnpm install --frozen-lockfile
        else
            npm install
        fi
        
        echo "アプリケーションをビルド中..."
        if command -v pnpm &> /dev/null; then
            pnpm run build
        else
            npm run build
        fi
        
        echo "アプリケーションを再起動中..."
        $0 restart
        ;;
    
    "backup")
        BACKUP_DIR="/home/rebelor/domains/jungamer.uk/private_html/backup/manual-$(date +%Y%m%d-%H%M%S)"
        echo "=== バックアップ実行 ==="
        echo "バックアップ先: $BACKUP_DIR"
        
        mkdir -p $BACKUP_DIR
        
        # アプリケーションファイルのバックアップ
        if [ -d "$DEPLOY_PATH" ]; then
            echo "アプリケーションファイルをバックアップ中..."
            cp -r $DEPLOY_PATH $BACKUP_DIR/application
        fi
        
        # ログファイルのバックアップ
        if [ -d "$LOG_PATH" ]; then
            echo "ログファイルをバックアップ中..."
            cp -r $LOG_PATH $BACKUP_DIR/logs
        fi
        
        # アップロードファイルのバックアップ
        if [ -d "$DEPLOY_PATH/public/uploads" ]; then
            echo "アップロードファイルをバックアップ中..."
            cp -r $DEPLOY_PATH/public/uploads $BACKUP_DIR/uploads
        fi
        
        echo "バックアップ完了: $BACKUP_DIR"
        ;;
    
    "cleanup")
        echo "=== ログクリーンアップ ==="
        
        # 古いログファイルを削除
        find $LOG_PATH -name "*.log" -mtime +7 -delete 2>/dev/null || echo "ログディレクトリにアクセスできません"
        find $DEPLOY_PATH -name "*.log" -mtime +7 -delete 2>/dev/null
        
        echo "=== 一時ファイルクリーンアップ ==="
        cd $DEPLOY_PATH
        
        # Next.jsキャッシュクリア
        rm -rf .next/cache/* 2>/dev/null || echo "キャッシュディレクトリにアクセスできません"
        
        echo "クリーンアップ完了"
        ;;
    
    "health")
        echo "=== CoreServer ヘルスチェック ==="
        
        # Node.jsプロセス確認
        if pgrep -f "node.*server.js" > /dev/null; then
            echo "✓ Node.jsプロセス: 実行中"
        else
            echo "✗ Node.jsプロセス: 停止"
        fi
        
        # ポート確認（CoreServerでは制限あり）
        if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
            echo "✓ ポート3000: リスニング中"
        else
            echo "✗ ポート3000: 利用不可"
        fi
        
        # ディスク容量確認
        DISK_USAGE=$(df $DEPLOY_PATH 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//' || echo "0")
        if [ "$DISK_USAGE" != "0" ] && [ $DISK_USAGE -lt 80 ]; then
            echo "✓ ディスク使用量: ${DISK_USAGE}%"
        elif [ "$DISK_USAGE" != "0" ]; then
            echo "⚠ ディスク使用量: ${DISK_USAGE}% (警告)"
        else
            echo "⚠ ディスク使用量: 取得不可"
        fi
        
        # アプリケーションファイル確認
        if [ -f "$DEPLOY_PATH/server.js" ]; then
            echo "✓ server.js: 存在"
        else
            echo "✗ server.js: 不足"
        fi
        
        if [ -f "$DEPLOY_PATH/.env" ]; then
            echo "✓ .env: 存在"
        else
            echo "✗ .env: 不足"
        fi
        ;;
    
    "env")
        echo "=== 環境変数確認 ==="
        echo "Node.js: $(node --version 2>/dev/null || echo '未インストール')"
        echo "npm: $(npm --version 2>/dev/null || echo '未インストール')"
        echo "pnpm: $(pnpm --version 2>/dev/null || echo '未インストール')"
        echo "Git: $(git --version 2>/dev/null || echo '未インストール')"
        echo "ホームディレクトリ: $HOME"
        echo "現在のディレクトリ: $(pwd)"
        echo "ユーザー: rebelor"
        ;;
    
    *)
        echo "GMO CoreServer用メンテナンススクリプト"
        echo "使用方法: $0 {status|logs|restart|stop|start|update|backup|cleanup|health|env}"
        echo ""
        echo "コマンド説明:"
        echo "  status  - アプリケーションとシステムの状態を表示"
        echo "  logs    - アプリケーションログを表示 (オプション: 行数)"
        echo "  restart - アプリケーションを再起動"
        echo "  stop    - アプリケーションを停止"
        echo "  start   - アプリケーションを開始"
        echo "  update  - GitリポジトリからコードをプルしてAP更新"
        echo "  backup  - アプリケーションとファイルをバックアップ"
        echo "  cleanup - ログと一時ファイルをクリーンアップ"
        echo "  health  - アプリケーションのヘルスチェック"
        echo "  env     - 環境情報を表示"
        exit 1
        ;;
esac
