# Blog API利用サンプルコード

このディレクトリには、Blog APIを使用して記事を作成・管理するためのサンプルコードが含まれています。

## 前提条件

1. **APIキーの取得**
   - 管理者としてログイン: `http://localhost:3000/auth/login`
   - APIキー管理ページにアクセス: `http://localhost:3000/admin/api-keys`
   - 新しいAPIキーを作成し、適切な権限を設定

2. **API Base URL**
   ```
   http://localhost:3000/api
   ```

3. **必要な権限**
   - `posts.create` - 記事作成
   - `posts.read` - 記事一覧取得
   - `posts.update` - 記事更新
   - `posts.delete` - 記事削除

## 利用可能なエンドポイント

### 記事関連
- `POST /api/posts` - 記事作成
- `GET /api/posts` - 記事一覧取得
- `GET /api/posts/[slug]` - 特定記事取得
- `PUT /api/posts/[slug]` - 記事更新
- `DELETE /api/posts/[slug]` - 記事削除

### 認証
- ヘッダーに `x-api-key: YOUR_API_KEY` を含める

## サンプルファイル

1. `javascript/create-post.js` - JavaScript (Node.js)
2. `python/create_post.py` - Python
3. `curl/examples.sh` - cURL
4. `typescript/create-post.ts` - TypeScript

各ファイルには、基本的な記事作成から高度な機能まで含まれています。
