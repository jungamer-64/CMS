# Blog API Documentation

このAPIを使用して、ブログ投稿をプログラム的に管理できます。

## 認証

すべてのAPI操作（GET以外）には、APIキーが必要です。

### APIキーの設定

1. 管理画面 (`/admin/settings`) にアクセス
2. API設定セクションで「APIアクセス」を有効化
3. APIキーを生成または設定
4. 設定を保存

### APIキーの使用方法

リクエストヘッダーに以下のいずれかの方法でAPIキーを含めてください：

```bash
# 方法1: X-API-Key ヘッダー
curl -H "X-API-Key: your_api_key_here" ...

# 方法2: Authorization Bearer ヘッダー
curl -H "Authorization: Bearer your_api_key_here" ...
```

## エンドポイント

### 1. 投稿を作成

**POST** `/api/posts`

新しいブログ投稿を作成します。

#### リクエスト例

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "title": "新しい投稿のタイトル",
    "content": "投稿の内容です。マークダウンが使用できます。",
    "author": "投稿者名",
    "slug": "custom-slug"
  }'
```

#### パラメータ

- `title` (必須): 投稿のタイトル
- `content` (必須): 投稿の内容
- `author` (必須): 投稿者名
- `slug` (任意): カスタムスラッグ（指定しない場合は自動生成）

#### レスポンス例

```json
{
  "success": true,
  "message": "投稿が正常に作成されました",
  "post": {
    "id": "1753911234567",
    "slug": "custom-slug",
    "title": "新しい投稿のタイトル",
    "content": "投稿の内容です。",
    "author": "投稿者名",
    "createdAt": "2025-07-30T21:00:00.000Z",
    "updatedAt": "2025-07-30T21:00:00.000Z"
  }
}
```

### 2. 投稿一覧を取得

**GET** `/api/posts`

投稿一覧をページネーション付きで取得します。

#### リクエスト例

```bash
curl -H "X-API-Key: your_api_key_here" \
  "http://localhost:3000/api/posts?page=1&limit=10&search=検索キーワード"
```

#### クエリパラメータ

- `page` (任意): ページ番号（デフォルト: 1）
- `limit` (任意): 1ページあたりの投稿数（デフォルト: 10）
- `search` (任意): 検索キーワード（タイトル、内容、著者を検索）

#### レスポンス例

```json
{
  "success": true,
  "posts": [
    {
      "id": "1753911234567",
      "slug": "example-post",
      "title": "サンプル投稿",
      "content": "投稿の内容...",
      "author": "投稿者名",
      "createdAt": "2025-07-30T21:00:00.000Z",
      "updatedAt": "2025-07-30T21:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 3. 特定の投稿を取得

**GET** `/api/posts/[slug]`

スラッグを指定して特定の投稿を取得します。

#### リクエスト例

```bash
curl http://localhost:3000/api/posts/example-post
```

#### レスポンス例

```json
{
  "id": "1753911234567",
  "slug": "example-post",
  "title": "サンプル投稿",
  "content": "投稿の内容...",
  "author": "投稿者名",
  "createdAt": "2025-07-30T21:00:00.000Z",
  "updatedAt": "2025-07-30T21:00:00.000Z"
}
```

### 4. 投稿を更新

**PUT** `/api/posts/[slug]`

既存の投稿を更新します。

#### リクエスト例

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

#### パラメータ

- `title` (必須): 更新後のタイトル
- `content` (必須): 更新後の内容
- `slug` (必須): 更新後のスラッグ

#### レスポンス例

```json
{
  "success": true,
  "message": "投稿が正常に更新されました",
  "post": {
    "id": "1753911234567",
    "slug": "updated-slug",
    "title": "更新されたタイトル",
    "content": "更新された内容",
    "author": "投稿者名",
    "createdAt": "2025-07-30T21:00:00.000Z",
    "updatedAt": "2025-07-30T21:15:00.000Z"
  }
}
```

### 5. 投稿を削除

**DELETE** `/api/posts/[slug]`

投稿を削除します。

#### リクエスト例

```bash
curl -X DELETE http://localhost:3000/api/posts/example-post \
  -H "X-API-Key: your_api_key_here"
```

#### レスポンス例

```json
{
  "success": true,
  "message": "投稿が正常に削除されました"
}
```

## エラーレスポンス

### 認証エラー (401)

```json
{
  "error": "API key is required. Use X-API-Key header or Authorization: Bearer <key>"
}
```

### レート制限エラー (429)

```json
{
  "error": "Rate limit exceeded. Try again in 45 seconds"
}
```

### バリデーションエラー (400)

```json
{
  "error": "タイトル、内容、著者は必須です"
}
```

### 投稿が見つからない (404)

```json
{
  "error": "投稿が見つかりません"
}
```

### サーバーエラー (500)

```json
{
  "error": "投稿の作成に失敗しました"
}
```

## レート制限

API使用には以下の制限があります：

- 投稿作成: 1分間に5リクエストまで
- その他の操作: 制限なし（現在）

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
  
  return await response.json();
}

// 投稿一覧を取得
async function getPosts(page = 1, limit = 10) {
  const response = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  
  return await response.json();
}

// 使用例
createPost({
  title: 'API経由で作成した投稿',
  content: 'この投稿はAPIを使って作成されました。',
  author: 'API User'
}).then(result => {
  console.log('投稿が作成されました:', result);
});
```

### Python での使用例

```python
import requests
import json

API_KEY = 'your_api_key_here'
BASE_URL = 'http://localhost:3000/api/posts'

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}

# 投稿を作成
def create_post(post_data):
    response = requests.post(BASE_URL, headers=headers, json=post_data)
    return response.json()

# 投稿一覧を取得
def get_posts(page=1, limit=10):
    params = {'page': page, 'limit': limit}
    response = requests.get(BASE_URL, headers=headers, params=params)
    return response.json()

# 使用例
result = create_post({
    'title': 'Python APIで作成した投稿',
    'content': 'この投稿はPython APIを使って作成されました。',
    'author': 'Python User'
})

print('投稿が作成されました:', result)
```
