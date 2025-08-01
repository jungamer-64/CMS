#!/bin/bash

# GMO CoreServer用 SSL証明書設定ガイドスクリプト

DOMAIN=${1:-jungamer.uk}
EMAIL=${2:-jumpeitakino@hotmail.com}

echo "=== GMO CoreServer SSL証明書設定ガイド ==="
echo "ドメイン: $DOMAIN"
echo "メール: $EMAIL"

echo ""
echo "GMO CoreServerでは、SSL証明書は管理画面から設定します。"
echo "以下の手順に従ってSSL証明書を設定してください："

echo ""
echo "=== 手順 1: CoreServer管理画面にログイン ==="
echo "1. CoreServer管理画面 (https://www.coreserver.jp/) にアクセス"
echo "2. アカウントでログイン"

echo ""
echo "=== 手順 2: SSL証明書の設定 ==="
echo "1. 「ドメイン」メニューを選択"
echo "2. 対象ドメイン「$DOMAIN」を選択"
echo "3. 「SSL設定」タブをクリック"

echo ""
echo "=== 手順 3: Let's Encrypt証明書の取得 ==="
echo "1. 「無料SSL（Let's Encrypt）」を選択"
echo "2. 対象ドメインを確認: $DOMAIN, www.$DOMAIN"
echo "3. 「SSL証明書を取得」ボタンをクリック"
echo "4. 証明書の発行を待つ（数分程度）"

echo ""
echo "=== 手順 4: HTTPS強制リダイレクトの設定 ==="
echo "1. 「HTTP→HTTPS リダイレクト」を「有効」に設定"
echo "2. 設定を保存"

echo ""
echo "=== 手順 5: 動作確認 ==="
echo "1. https://$DOMAIN にアクセスして SSL 証明書が有効か確認"
echo "2. http://$DOMAIN にアクセスして HTTPS にリダイレクトされるか確認"

echo ""
echo "=== 自動更新について ==="
echo "CoreServerのLet's Encrypt証明書は自動更新されます。"
echo "手動での更新作業は不要です。"
