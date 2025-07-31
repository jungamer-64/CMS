#!/bin/bash

# Blog API - 記事作成サンプル (cURL)
# 
# 使用方法:
#   chmod +x examples.sh
#   ./examples.sh

# 設定
API_BASE_URL="http://localhost:3000/api"
API_KEY="api_n1npkrgk6tmdqgfpq3"  # 実際のAPIキーに置き換えてください

# 色付きの出力関数
print_success() { echo -e "\e[32m✅ $1\e[0m"; }
print_error() { echo -e "\e[31m❌ $1\e[0m"; }
print_info() { echo -e "\e[34m📝 $1\e[0m"; }
print_warning() { echo -e "\e[33m⚠️  $1\e[0m"; }

echo "🚀 Blog API cURL サンプル開始"
echo "================================"
echo

# 1. 基本的な記事作成
print_info "基本的な記事を作成中..."

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "title": "cURLで作成した記事",
    "content": "# cURLで作成した記事\n\nこの記事はcURLコマンドを使用してAPIから作成されました。\n\n## cURLの特徴\n\n- **軽量**: 単一のコマンドで実行\n- **汎用的**: あらゆるHTTP操作に対応\n- **デバッグ**: APIテストに最適\n\n```bash\ncurl -X POST -H \"Content-Type: application/json\" \\\n     -d \047{\"title\": \"記事タイトル\"}\047 \\\n     https://api.example.com/posts\n```",
    "author": "cURL User"
  }' \
  "$API_BASE_URL/posts")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 201 ]; then
    print_success "記事作成成功"
    echo "$RESPONSE_BODY" | jq -r '.post.title, .post.slug' | while read title; read slug; do
        echo "  📄 タイトル: $title"
        echo "  🔗 URL: http://localhost:3000/blog/$slug"
    done
    BASIC_SLUG=$(echo "$RESPONSE_BODY" | jq -r '.post.slug')
else
    print_error "記事作成失敗 (HTTP $HTTP_STATUS)"
    echo "$RESPONSE_BODY" | jq -r '.error // empty'
fi

echo

# 2. カスタムスラッグ付きの記事作成
print_info "カスタムスラッグ付きの記事を作成中..."

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "title": "cURL API ガイド",
    "content": "# cURL API 活用ガイド\n\n## 基本的な使い方\n\n### GET リクエスト\n```bash\ncurl -H \"x-api-key: YOUR_API_KEY\" \\\n     http://localhost:3000/api/posts\n```\n\n### POST リクエスト\n```bash\ncurl -X POST \\\n     -H \"Content-Type: application/json\" \\\n     -H \"x-api-key: YOUR_API_KEY\" \\\n     -d \047{\"title\": \"新記事\"}\047 \\\n     http://localhost:3000/api/posts\n```\n\n### PUT リクエスト\n```bash\ncurl -X PUT \\\n     -H \"Content-Type: application/json\" \\\n     -H \"x-api-key: YOUR_API_KEY\" \\\n     -d \047{\"title\": \"更新後タイトル\"}\047 \\\n     http://localhost:3000/api/posts/post-slug\n```\n\n## レスポンス形式\n\n成功時:\n```json\n{\n  \"success\": true,\n  \"post\": {\n    \"id\": \"123\",\n    \"title\": \"記事タイトル\",\n    \"slug\": \"article-slug\"\n  }\n}\n```\n\nエラー時:\n```json\n{\n  \"error\": \"エラーメッセージ\"\n}\n```",
    "author": "cURL Expert",
    "slug": "curl-api-guide"
  }' \
  "$API_BASE_URL/posts")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 201 ]; then
    print_success "カスタムスラッグ付き記事作成成功"
    echo "$RESPONSE_BODY" | jq -r '.post.title, .post.slug' | while read title; read slug; do
        echo "  📄 タイトル: $title"
        echo "  🔗 URL: http://localhost:3000/blog/$slug"
    done
    CUSTOM_SLUG=$(echo "$RESPONSE_BODY" | jq -r '.post.slug')
else
    print_error "記事作成失敗 (HTTP $HTTP_STATUS)"
    echo "$RESPONSE_BODY" | jq -r '.error // empty'
fi

echo

# 3. 記事一覧取得
print_info "記事一覧を取得中..."

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "x-api-key: $API_KEY" \
  "$API_BASE_URL/posts")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
    print_success "記事一覧取得成功"
    POST_COUNT=$(echo "$RESPONSE_BODY" | jq -r '.posts | length')
    echo "  📊 総記事数: $POST_COUNT"
    
    echo "  📚 記事一覧:"
    echo "$RESPONSE_BODY" | jq -r '.posts[] | "    • \(.title) (\(.slug))"'
else
    print_error "記事一覧取得失敗 (HTTP $HTTP_STATUS)"
    echo "$RESPONSE_BODY" | jq -r '.error // empty'
fi

echo

# 4. 特定記事取得
if [ ! -z "$BASIC_SLUG" ]; then
    print_info "特定記事を取得中: $BASIC_SLUG"
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -H "x-api-key: $API_KEY" \
      "$API_BASE_URL/posts/$BASIC_SLUG")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        print_success "記事取得成功"
        echo "$RESPONSE_BODY" | jq -r '.post.title, .post.author' | while read title; read author; do
            echo "  📄 タイトル: $title"
            echo "  ✍️  著者: $author"
        done
        CONTENT_PREVIEW=$(echo "$RESPONSE_BODY" | jq -r '.post.content' | head -c 100)
        echo "  📝 内容: ${CONTENT_PREVIEW}..."
    else
        print_error "記事取得失敗 (HTTP $HTTP_STATUS)"
        echo "$RESPONSE_BODY" | jq -r '.error // empty'
    fi
    
    echo
fi

# 5. 記事更新（権限が必要）
if [ ! -z "$CUSTOM_SLUG" ]; then
    print_info "記事を更新中: $CUSTOM_SLUG"
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PUT \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d '{
        "content": "# cURL API 活用ガイド\n\n## 基本的な使い方\n\n### GET リクエスト\n```bash\ncurl -H \"x-api-key: YOUR_API_KEY\" \\\n     http://localhost:3000/api/posts\n```\n\n### POST リクエスト\n```bash\ncurl -X POST \\\n     -H \"Content-Type: application/json\" \\\n     -H \"x-api-key: YOUR_API_KEY\" \\\n     -d \047{\"title\": \"新記事\"}\047 \\\n     http://localhost:3000/api/posts\n```\n\n### PUT リクエスト\n```bash\ncurl -X PUT \\\n     -H \"Content-Type: application/json\" \\\n     -H \"x-api-key: YOUR_API_KEY\" \\\n     -d \047{\"title\": \"更新後タイトル\"}\047 \\\n     http://localhost:3000/api/posts/post-slug\n```\n\n## レスポンス形式\n\n成功時:\n```json\n{\n  \"success\": true,\n  \"post\": {\n    \"id\": \"123\",\n    \"title\": \"記事タイトル\",\n    \"slug\": \"article-slug\"\n  }\n}\n```\n\nエラー時:\n```json\n{\n  \"error\": \"エラーメッセージ\"\n}\n```\n\n## 更新情報\n\nこの記事はcURLコマンドによって更新されました。\n\n### 高度な使用例\n\n**ファイルから JSON を読み込んで送信:**\n```bash\ncurl -X POST \\\n     -H \"Content-Type: application/json\" \\\n     -H \"x-api-key: YOUR_API_KEY\" \\\n     -d @post_data.json \\\n     http://localhost:3000/api/posts\n```\n\n**レスポンスヘッダーも表示:**\n```bash\ncurl -i -H \"x-api-key: YOUR_API_KEY\" \\\n     http://localhost:3000/api/posts\n```"
      }' \
      "$API_BASE_URL/posts/$CUSTOM_SLUG")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        print_success "記事更新成功"
        echo "$RESPONSE_BODY" | jq -r '.post.title' | while read title; do
            echo "  📄 更新された記事: $title"
        done
    else
        print_error "記事更新失敗 (HTTP $HTTP_STATUS)"
        echo "$RESPONSE_BODY" | jq -r '.error // empty'
    fi
    
    echo
fi

# 6. エラーハンドリングの例
print_info "エラーハンドリングのテスト（存在しない記事にアクセス）..."

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "x-api-key: $API_KEY" \
  "$API_BASE_URL/posts/non-existent-post")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 404 ]; then
    print_warning "期待通り404エラーが返されました"
    echo "$RESPONSE_BODY" | jq -r '.error // empty'
else
    print_error "予期しないレスポンス (HTTP $HTTP_STATUS)"
fi

echo
echo "✨ すべての cURL サンプルが完了しました！"
echo "🌐 ブログを確認: http://localhost:3000/blog"
echo
echo "📋 便利なcURLコマンド一覧:"
echo "  記事作成: curl -X POST -H \"Content-Type: application/json\" -H \"x-api-key: \$API_KEY\" -d '{...}' \$API_BASE_URL/posts"
echo "  記事一覧: curl -H \"x-api-key: \$API_KEY\" \$API_BASE_URL/posts"
echo "  記事取得: curl -H \"x-api-key: \$API_KEY\" \$API_BASE_URL/posts/SLUG"
echo "  記事更新: curl -X PUT -H \"Content-Type: application/json\" -H \"x-api-key: \$API_KEY\" -d '{...}' \$API_BASE_URL/posts/SLUG"
echo "  記事削除: curl -X DELETE -H \"x-api-key: \$API_KEY\" \$API_BASE_URL/posts/SLUG"
