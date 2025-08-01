#!/bin/bash

# GMO CoreServer SSL証明書確認スクリプト

DOMAIN=${1:-jungamer.uk}

echo "=== GMO CoreServer SSL証明書確認 ==="
echo "対象ドメイン: $DOMAIN"
echo ""

# SSL証明書の確認
echo "=== SSL証明書情報の確認 ==="
echo "HTTPS接続テスト中..."

if command -v openssl &> /dev/null; then
    echo "OpenSSLでSSL証明書を確認中..."
    echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ SSL証明書が正常に設定されています"
    else
        echo "✗ SSL証明書の確認に失敗しました"
    fi
else
    echo "OpenSSLが利用できません"
fi

echo ""

# HTTP -> HTTPS リダイレクトの確認
echo "=== HTTP → HTTPS リダイレクト確認 ==="
if command -v curl &> /dev/null; then
    echo "HTTPリダイレクトテスト中..."
    REDIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 http://$DOMAIN/)
    
    if [ "$REDIRECT_STATUS" = "301" ] || [ "$REDIRECT_STATUS" = "302" ]; then
        echo "✓ HTTP→HTTPSリダイレクトが設定されています (Status: $REDIRECT_STATUS)"
    else
        echo "✗ HTTPリダイレクトが設定されていません (Status: $REDIRECT_STATUS)"
    fi
    
    # HTTPS接続テスト
    echo "HTTPS接続テスト中..."
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/)
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        echo "✓ HTTPS接続が正常です (Status: $HTTPS_STATUS)"
    else
        echo "✗ HTTPS接続に問題があります (Status: $HTTPS_STATUS)"
    fi
else
    echo "curlが利用できません"
fi

echo ""

# セキュリティヘッダーの確認
echo "=== セキュリティヘッダー確認 ==="
if command -v curl &> /dev/null; then
    echo "セキュリティヘッダーを確認中..."
    curl -s -I https://$DOMAIN/ | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"
    
    if [ $? -eq 0 ]; then
        echo "✓ セキュリティヘッダーが設定されています"
    else
        echo "! セキュリティヘッダーの追加設定を推奨します"
    fi
fi

echo ""
echo "=== 確認完了 ==="
echo "問題がある場合は、CoreServer管理画面でSSL設定を確認してください。"
