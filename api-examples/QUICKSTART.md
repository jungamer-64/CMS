# 🚀 Blog API サンプルコード - クイックスタート

このガイドでは、Blog APIを使用して記事を作成・管理する方法を素早く学べます。

## 📋 前提条件

1. **ブログアプリケーションが動作している**
   ```bash
   # ブログアプリケーションを起動
   cd ..
   npm run dev
   ```

2. **APIキーを取得済み**
   - 管理画面にログイン: http://localhost:3000/auth/login
   - ユーザー名: `admin`, パスワード: `password`
   - APIキー管理: http://localhost:3000/admin/api-keys
   - 「新しいAPIキーを作成」をクリック
   - 投稿権限（`posts.create`, `posts.read`）を有効にして作成

## ⚡ 5分で始める

### 1. JavaScript (Node.js) で試す

```bash
# 依存関係をインストール
cd api-examples
npm install

# APIキーを設定
# javascript/create-post.js の API_KEY を実際のキーに変更

# 実行
npm run start:js
```

### 2. Python で試す

```bash
# Pythonの依存関係をインストール
pip install requests

# APIキーを設定
# python/create_post.py の API_KEY を実際のキーに変更

# 実行
npm run start:py
# または
python python/create_post.py
```

### 3. cURL で試す

```bash
# APIキーを設定
# curl/examples.sh の API_KEY を実際のキーに変更

# 実行権限を付与（Linux/macOS）
chmod +x curl/examples.sh

# 実行
npm run start:curl
# または
bash curl/examples.sh
```

### 4. TypeScript で試す

```bash
# TypeScript依存関係をインストール
npm install

# APIキーを設定
# typescript/create-post.ts の API_KEY を実際のキーに変更

# 実行
npm run start:ts
```

## 📝 基本的な使用例

### 記事作成の最小コード

#### JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    title: '私の最初の記事',
    content: 'APIで作成した記事の内容です。',
    author: 'APIユーザー'
  })
});

const result = await response.json();
console.log('記事が作成されました:', result.post.slug);
```

#### Python
```python
import requests

response = requests.post('http://localhost:3000/api/posts', 
  headers={'x-api-key': 'YOUR_API_KEY'},
  json={
    'title': '私の最初の記事',
    'content': 'APIで作成した記事の内容です。',
    'author': 'APIユーザー'
  }
)

result = response.json()
print(f"記事が作成されました: {result['post']['slug']}")
```

#### cURL
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "title": "私の最初の記事",
    "content": "APIで作成した記事の内容です。",
    "author": "APIユーザー"
  }'
```

## 🔧 高度な使用例

### カスタムスラッグ付き記事作成
```javascript
const postData = {
  title: 'SEOフレンドリーな記事',
  content: '検索エンジンに優しいURL構造を持つ記事です。',
  author: 'SEO専門家',
  slug: 'seo-friendly-article'  // カスタムスラッグ
};
```

### バッチ処理（複数記事の一括作成）
```javascript
const posts = [
  { title: '記事1', content: '内容1', author: '著者1' },
  { title: '記事2', content: '内容2', author: '著者2' },
  { title: '記事3', content: '内容3', author: '著者3' }
];

for (const post of posts) {
  await createPost(post);
  await sleep(1000); // レート制限対策
}
```

## 🐛 トラブルシューティング

### よくあるエラー

#### `401 Unauthorized`
- APIキーが正しく設定されていない
- APIキーの権限が不足している
- ヘッダー名が間違っている（`x-api-key`を使用）

#### `429 Too Many Requests`
- レート制限に引っかかっている
- リクエスト間に1秒程度の間隔を空ける

#### `400 Bad Request`
- 必須フィールド（title, content, author）が不足
- JSONフォーマットが不正

### デバッグ方法

1. **ブラウザの開発者ツールでネットワークタブを確認**
2. **サーバーログを確認**
   ```bash
   # ブログアプリケーションのログを確認
   cd ..
   npm run dev
   ```
3. **APIキーの権限を確認**
   - http://localhost:3000/admin/api-keys で権限設定を確認

## 📚 詳細ドキュメント

- `README.md` - 全体概要
- `javascript/create-post.js` - Node.js実装の詳細
- `python/create_post.py` - Python実装の詳細
- `typescript/create-post.ts` - TypeScript実装の詳細
- `curl/examples.sh` - cURL使用例

## 🎯 次のステップ

1. **記事更新・削除**: PUT/DELETEメソッドを試す
2. **検索機能**: 記事一覧にフィルタリング追加
3. **画像アップロード**: ファイルアップロード機能の実装
4. **コメント機能**: コメントAPIの利用
5. **認証強化**: JWT認証の実装

## 💡 ヒント

- **レート制限**: 1分間に5投稿まで
- **文字制限**: タイトル100文字、内容10,000文字
- **スラッグ**: 英数字とハイフンのみ
- **Markdown対応**: 記事内容でMarkdown記法が使用可能

Happy coding! 🚀
