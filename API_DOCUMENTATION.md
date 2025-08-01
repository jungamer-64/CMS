# Blog API Documentation

このAPIを使用して、ブログ投稿をプログラム的に管理できます。

## 認証

### 認証方式

このAPIでは2つの認証方式をサポートしています：

1. **セッション認証** - ウェブアプリケーション用
2. **APIキー認証** - プログラマティックアクセス用

### APIキーの設定

1. 管理画面 (`/admin/api-keys`) にアクセス
2. 「新しいAPIキーを作成」をクリック
3. APIキーの名前と権限を設定
4. 生成されたAPIキーをコピーして保存

### APIキーの使用方法

リクエストヘッダーに以下のいずれかの方法でAPIキーを含めてください：

```bash
# 方法1: X-API-Key ヘッダー
curl -H "X-API-Key: your_api_key_here" ...

# 方法2: Authorization Bearer ヘッダー
curl -H "Authorization: Bearer your_api_key_here" ...
```

### 権限レベル

- **READ**: 投稿の読み取り専用
- **WRITE**: 投稿の作成・更新
- **DELETE**: 投稿の削除
- **ADMIN**: 全ての操作（ユーザー管理、設定変更等）

## エンドポイント

### 1. 投稿を作成

**POST** `/api/posts`

新しいブログ投稿を作成します。

#### 投稿作成のリクエスト例

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "title": "新しい投稿のタイトル",
    "content": "投稿の内容です。マークダウンが使用できます。",
    "author": "投稿者名",
    "slug": "custom-slug",
    "media": []
  }'
```

#### リクエストパラメータ

- `title` (必須): 投稿のタイトル (1-200文字)
- `content` (必須): 投稿の内容 (マークダウン形式)
- `author` (必須): 投稿者名またはusername
- `slug` (任意): カスタムスラッグ（指定しない場合は自動生成）
- `media` (任意): 関連するメディアファイルの配列

#### 投稿作成のレスポンス例

```json
{
  "success": true,
  "data": {
    "id": "1753911234567",
    "slug": "custom-slug",
    "title": "新しい投稿のタイトル",
    "content": "投稿の内容です。",
    "author": "投稿者名",
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-01T12:00:00.000Z",
    "media": []
  },
  "message": "投稿が正常に作成されました"
}
```

### 2. 投稿一覧を取得

**GET** `/api/posts`

投稿一覧をページネーション付きで取得します。

#### 投稿一覧取得のリクエスト例

```bash
curl -H "X-API-Key: your_api_key_here" \
  "http://localhost:3000/api/posts?page=1&limit=10&search=検索キーワード&type=published&sortBy=createdAt&sortOrder=desc"
```

#### 投稿一覧のクエリパラメータ

- `page` (任意): ページ番号（デフォルト: 1）
- `limit` (任意): 1ページあたりの投稿数（デフォルト: 10、最大: 100）
- `search` (任意): 検索キーワード（タイトル、内容、著者を検索）
- `type` (任意): 投稿タイプ（`all`、`published`、`deleted`、デフォルト: `published`）
- `author` (任意): 特定の著者でフィルタリング
- `sortBy` (任意): ソート項目（`createdAt`、`updatedAt`、`title`、デフォルト: `createdAt`）
- `sortOrder` (任意): ソート順（`asc`、`desc`、デフォルト: `desc`）

#### 投稿一覧取得のレスポンス例

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "1753911234567",
        "slug": "example-post",
        "title": "サンプル投稿",
        "content": "投稿の内容...",
        "author": "投稿者名",
        "createdAt": "2025-08-01T12:00:00.000Z",
        "updatedAt": "2025-08-01T12:00:00.000Z",
        "media": []
      }
    ],
    "total": 25,
    "filters": {
      "page": 1,
      "limit": 10,
      "type": "published",
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  },
  "message": "投稿一覧を取得しました"
}
```

### 3. 特定の投稿を取得

**GET** `/api/posts/[slug]`

スラッグを指定して特定の投稿を取得します。

#### 特定投稿取得のリクエスト例

```bash
curl http://localhost:3000/api/posts/example-post
```

#### 特定投稿取得のレスポンス例

```json
{
  "success": true,
  "data": {
    "id": "1753911234567",
    "slug": "example-post",
    "title": "サンプル投稿",
    "content": "投稿の内容...",
    "author": "投稿者名",
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-01T12:00:00.000Z",
    "media": []
  },
  "message": "投稿を取得しました"
}
```

### 4. 投稿を更新

**PUT** `/api/posts/[slug]`

既存の投稿を更新します。

#### 投稿更新のリクエスト例

```bash
curl -X PUT http://localhost:3000/api/posts/example-post \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "title": "更新されたタイトル",
    "content": "更新された内容",
    "slug": "updated-slug"
  }'
```

#### 投稿更新のパラメータ

- `title` (必須): 更新後のタイトル
- `content` (必須): 更新後の内容
- `slug` (必須): 更新後のスラッグ
- `media` (任意): 関連するメディアファイルの配列

#### 投稿更新のレスポンス例

```json
{
  "success": true,
  "data": {
    "id": "1753911234567",
    "slug": "updated-slug",
    "title": "更新されたタイトル",
    "content": "更新された内容",
    "author": "投稿者名",
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-01T12:15:00.000Z",
    "media": []
  },
  "message": "投稿が正常に更新されました"
}
```

### 5. 投稿を削除

**DELETE** `/api/posts/[slug]`

投稿を削除します。

#### 投稿削除のリクエスト例

```bash
curl -X DELETE http://localhost:3000/api/posts/example-post \
  -H "X-API-Key: your_api_key_here"
```

#### 投稿削除のレスポンス例

```json
{
  "success": true,
  "message": "投稿が正常に削除されました"
}
```

## エラーレスポンス

すべてのエラーレスポンスは以下の統一された形式で返されます：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 認証エラー (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です"
  }
}
```

### 権限不足エラー (403)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "この操作を実行する権限がありません"
  }
}
```

### 投稿が見つからない (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "投稿が見つかりません"
  }
}
```

### バリデーションエラー (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": {
      "title": "タイトルは必須です",
      "content": "内容は10文字以上である必要があります"
    }
  }
}
```

### レート制限エラー (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "リクエスト頻度が制限を超えました。しばらく待ってから再試行してください"
  }
}
```

### サーバーエラー (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "内部サーバーエラーが発生しました"
  }
}
```

## レート制限

API使用には以下の制限があります：

- **投稿作成**: 1分間に5リクエストまで
- **投稿更新**: 1分間に10リクエストまで
- **投稿削除**: 1分間に3リクエストまで
- **投稿取得**: 制限なし（現在）

レート制限に達した場合は、429ステータスコードとエラーメッセージが返されます。

## セキュリティ

### HTTPS推奨

本番環境では必ずHTTPSを使用してください。

### APIキーの管理

- APIキーは安全に保管してください
- 定期的にAPIキーをローテーションしてください
- 不要になったAPIキーは無効化してください
- 最小権限の原則に従って権限を設定してください

## 使用例

### Node.js での使用例

```javascript
const API_KEY = 'your_api_key_here';
const BASE_URL = 'http://localhost:3000/api/posts';

// 投稿を作成
async function createPost(postData) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(postData)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
}

// 投稿一覧を取得
async function getPosts(options = {}) {
  const params = new URLSearchParams();
  if (options.page) params.set('page', options.page);
  if (options.limit) params.set('limit', options.limit);
  if (options.search) params.set('search', options.search);
  if (options.type) params.set('type', options.type);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.sortOrder) params.set('sortOrder', options.sortOrder);
  
  const url = `${BASE_URL}?${params}`;
  const response = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
}

// 特定の投稿を取得
async function getPost(slug) {
  const response = await fetch(`${BASE_URL}/${slug}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
}

// 投稿を更新
async function updatePost(slug, updateData) {
  const response = await fetch(`${BASE_URL}/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(updateData)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
}

// 使用例
async function example() {
  try {
    // 投稿を作成
    const newPost = await createPost({
      title: 'API経由で作成した投稿',
      content: 'この投稿はAPIを使って作成されました。',
      author: 'API User',
      media: []
    });
    console.log('投稿が作成されました:', newPost);
    
    // 投稿一覧を取得
    const posts = await getPosts({
      page: 1,
      limit: 10,
      type: 'published',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    console.log('投稿一覧:', posts);
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

example();
```

### Python での使用例

```python
import requests
import json
from typing import Dict, Any, Optional, List

class BlogAPI:
    def __init__(self, api_key: str, base_url: str = 'http://localhost:3000/api'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        })
    
    def _handle_response(self, response: requests.Response) -> Any:
        """レスポンスを処理し、エラーをチェック"""
        try:
            data = response.json()
        except json.JSONDecodeError:
            raise Exception(f"Invalid JSON response: {response.text}")
        
        if not data.get('success', False):
            error_info = data.get('error', {})
            message = error_info.get('message', 'Unknown error')
            raise Exception(f"API Error: {message}")
        
        return data.get('data')
    
    def create_post(self, title: str, content: str, author: str, 
                   slug: Optional[str] = None, media: Optional[List] = None) -> Dict[str, Any]:
        """新しい投稿を作成"""
        post_data = {
            'title': title,
            'content': content,
            'author': author,
            'media': media or []
        }
        if slug:
            post_data['slug'] = slug
        
        response = self.session.post(f'{self.base_url}/posts', json=post_data)
        return self._handle_response(response)
    
    def get_posts(self, page: int = 1, limit: int = 10, search: Optional[str] = None,
                  post_type: str = 'published', sort_by: str = 'createdAt',
                  sort_order: str = 'desc') -> Dict[str, Any]:
        """投稿一覧を取得"""
        params = {
            'page': page,
            'limit': limit,
            'type': post_type,
            'sortBy': sort_by,
            'sortOrder': sort_order
        }
        if search:
            params['search'] = search
        
        response = self.session.get(f'{self.base_url}/posts', params=params)
        return self._handle_response(response)
    
    def get_post(self, slug: str) -> Dict[str, Any]:
        """特定の投稿を取得"""
        response = self.session.get(f'{self.base_url}/posts/{slug}')
        return self._handle_response(response)
    
    def update_post(self, slug: str, title: str, content: str, 
                   new_slug: Optional[str] = None, media: Optional[List] = None) -> Dict[str, Any]:
        """投稿を更新"""
        update_data = {
            'title': title,
            'content': content,
            'slug': new_slug or slug,
            'media': media or []
        }
        
        response = self.session.put(f'{self.base_url}/posts/{slug}', json=update_data)
        return self._handle_response(response)
    
    def delete_post(self, slug: str) -> bool:
        """投稿を削除"""
        response = self.session.delete(f'{self.base_url}/posts/{slug}')
        self._handle_response(response)
        return True

# 使用例
if __name__ == '__main__':
    api = BlogAPI('your_api_key_here')
    
    try:
        # 投稿を作成
        new_post = api.create_post(
            title='Python APIで作成した投稿',
            content='この投稿はPython APIクライアントを使って作成されました。',
            author='Python User'
        )
        print('投稿が作成されました:', new_post['title'])
        
        # 投稿一覧を取得
        posts_data = api.get_posts(page=1, limit=5, post_type='published')
        print(f'投稿数: {posts_data["total"]}')
        
        # 特定の投稿を取得
        if posts_data['posts']:
            first_post = api.get_post(posts_data['posts'][0]['slug'])
            print('最初の投稿:', first_post['title'])
        
    except Exception as e:
        print(f'エラー: {e}')
```

### cURL スクリプトの例

```bash
#!/bin/bash

API_KEY="your_api_key_here"
BASE_URL="http://localhost:3000/api/posts"

# 投稿を作成
echo "投稿を作成中..."
RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "title": "cURLで作成した投稿",
    "content": "この投稿はcURLコマンドで作成されました。",
    "author": "cURL User",
    "media": []
  }')

echo "レスポンス: $RESPONSE"

# 投稿一覧を取得
echo -e "\n投稿一覧を取得中..."
curl -s "$BASE_URL?page=1&limit=5&type=published" \
  -H "X-API-Key: $API_KEY" | jq .

# 特定の投稿を取得
echo -e "\n特定の投稿を取得中..."
curl -s "$BASE_URL/example-post" \
  -H "X-API-Key: $API_KEY" | jq .
```
