#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Blog API - 記事作成サンプル (Python)
"""

import requests
import json
import time
from typing import Dict, List, Optional

# 設定
API_BASE_URL = 'http://localhost:3000/api'
API_KEY = 'api_n1npkrgk6tmdqgfpq3'  # 実際のAPIキーに置き換えてください

class BlogAPIClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """HTTP リクエストを送信"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=self.headers)
            else:
                raise ValueError(f"サポートされていないHTTPメソッド: {method}")
            
            return {
                'status': response.status_code,
                'data': response.json() if response.content else {}
            }
        except requests.exceptions.RequestException as e:
            return {
                'status': 0,
                'error': str(e)
            }
    
    def create_post(self, title: str, content: str, author: str, slug: Optional[str] = None) -> Optional[Dict]:
        """記事を作成"""
        print(f"📝 記事作成中: {title}")
        
        post_data = {
            'title': title,
            'content': content,
            'author': author
        }
        
        if slug:
            post_data['slug'] = slug
        
        response = self._make_request('POST', '/posts', post_data)
        
        if response['status'] == 201:
            post = response['data']['post']
            print(f"✅ 記事作成成功: {post['title']}")
            print(f"🔗 記事URL: http://localhost:3000/blog/{post['slug']}")
            return post
        else:
            print(f"❌ 記事作成失敗: {response.get('data', response.get('error', '不明なエラー'))}")
            return None
    
    def get_all_posts(self) -> Optional[List[Dict]]:
        """全記事を取得"""
        print("📖 記事一覧取得中...")
        
        response = self._make_request('GET', '/posts')
        
        if response['status'] == 200:
            posts = response['data']['posts']
            print(f"✅ 記事一覧取得成功")
            print(f"📊 総記事数: {len(posts)}")
            
            for i, post in enumerate(posts, 1):
                print(f"{i}. {post['title']} ({post['slug']})")
            
            return posts
        else:
            print(f"❌ 記事一覧取得失敗: {response.get('data', response.get('error', '不明なエラー'))}")
            return None
    
    def get_post_by_slug(self, slug: str) -> Optional[Dict]:
        """特定の記事を取得"""
        print(f"📖 記事取得中: {slug}")
        
        response = self._make_request('GET', f'/posts/{slug}')
        
        if response['status'] == 200:
            post = response['data']['post']
            print(f"✅ 記事取得成功: {post['title']}")
            print(f"📝 内容: {post['content'][:100]}...")
            return post
        else:
            print(f"❌ 記事取得失敗: {response.get('data', response.get('error', '不明なエラー'))}")
            return None
    
    def update_post(self, slug: str, updates: Dict) -> Optional[Dict]:
        """記事を更新"""
        print(f"✏️  記事更新中: {slug}")
        
        response = self._make_request('PUT', f'/posts/{slug}', updates)
        
        if response['status'] == 200:
            post = response['data']['post']
            print(f"✅ 記事更新成功: {post['title']}")
            return post
        else:
            print(f"❌ 記事更新失敗: {response.get('data', response.get('error', '不明なエラー'))}")
            return None
    
    def delete_post(self, slug: str) -> bool:
        """記事を削除"""
        print(f"🗑️  記事削除中: {slug}")
        
        response = self._make_request('DELETE', f'/posts/{slug}')
        
        if response['status'] == 200:
            print(f"✅ 記事削除成功: {slug}")
            return True
        else:
            print(f"❌ 記事削除失敗: {response.get('data', response.get('error', '不明なエラー'))}")
            return False

def create_sample_posts(client: BlogAPIClient) -> List[Dict]:
    """サンプル記事を作成"""
    sample_posts = [
        {
            'title': 'Python入門ガイド',
            'content': '''# Python入門ガイド

Pythonは初心者にも優しいプログラミング言語です。

## 基本的な文法

```python
# Hello Worldを出力
print("Hello, World!")

# 変数の定義
name = "Python"
version = 3.9
```

## Pythonの特徴

- **シンプルな文法**: 読みやすく、書きやすい
- **豊富なライブラリ**: 様々な用途に対応
- **クロスプラットフォーム**: Windows、macOS、Linuxで動作

## 活用分野

1. Web開発 (Django, Flask)
2. データ分析 (pandas, numpy)
3. 機械学習 (scikit-learn, TensorFlow)
4. 自動化スクリプト''',
            'author': 'Python Expert',
            'slug': 'python-beginner-guide'
        },
        {
            'title': 'APIデザインのベストプラクティス',
            'content': '''# APIデザインのベストプラクティス

良いAPIを設計するための重要なポイントをまとめました。

## 1. RESTful設計原則

### リソース指向URL
```
GET    /api/posts       # 記事一覧
POST   /api/posts       # 記事作成
GET    /api/posts/{id}  # 特定記事取得
PUT    /api/posts/{id}  # 記事更新
DELETE /api/posts/{id}  # 記事削除
```

### 適切なHTTPステータスコード
- `200 OK`: 成功
- `201 Created`: 作成成功
- `400 Bad Request`: 不正なリクエスト
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: リソースが見つからない
- `500 Internal Server Error`: サーバーエラー

## 2. 認証とセキュリティ

- API キーによる認証
- レート制限の実装
- HTTPS の使用
- 入力値の検証

## 3. レスポンス形式の統一

```json
{
  "success": true,
  "data": {...},
  "message": "操作が完了しました",
  "timestamp": "2025-07-31T10:00:00Z"
}
```''',
            'author': 'API Architect'
        },
        {
            'title': 'Web開発で使える便利なツール',
            'content': '''# Web開発で使える便利なツール

効率的なWeb開発のためのツールを紹介します。

## フロントエンド開発

### フレームワーク・ライブラリ
- **React**: ユーザーインターフェース構築
- **Vue.js**: プログレッシブフレームワーク
- **Angular**: 本格的なSPAアプリケーション

### ビルドツール
- **Vite**: 高速な開発サーバー
- **Webpack**: 強力なバンドラー
- **Parcel**: ゼロ設定のビルドツール

## バックエンド開発

### Node.js
```javascript
// Express.jsサーバーの例
const express = require('express');
const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Python
```python
# FastAPIサーバーの例
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/hello")
def hello():
    return {"message": "Hello, World!"}
```

## 開発効率化ツール

1. **Git**: バージョン管理
2. **VS Code**: エディタ
3. **Postman**: API テスト
4. **Docker**: コンテナ化
5. **GitHub Actions**: CI/CD''',
            'author': 'Full Stack Developer'
        }
    ]
    
    created_posts = []
    
    for post_data in sample_posts:
        post = client.create_post(**post_data)
        if post:
            created_posts.append(post)
        
        # レート制限を避けるため少し待機
        time.sleep(1)
    
    return created_posts

def main():
    """メイン実行関数"""
    print("🚀 Blog API Python サンプル開始\n")
    
    # APIクライアント初期化
    client = BlogAPIClient(API_BASE_URL, API_KEY)
    
    try:
        # 1. 基本的な記事作成
        basic_post = client.create_post(
            title="Pythonで作成した記事",
            content="""# Pythonで作成した記事

この記事はPython スクリプトから API を呼び出して作成されました。

## Python の利点

- **読みやすいコード**: Pythonの文法は直感的
- **豊富なライブラリ**: 様々な機能を簡単に実装
- **コミュニティ**: 活発な開発者コミュニティ

```python
import requests

# API呼び出しの例
response = requests.post('http://localhost:3000/api/posts', 
                        json=post_data, 
                        headers=headers)
```

Happy coding! 🐍""",
            author="Python Script"
        )
        print()
        
        # 2. カスタムスラッグ付き記事作成
        custom_post = client.create_post(
            title="カスタムスラッグを持つPython記事",
            content="""# API活用ガイド

## API キーの取得方法

1. 管理画面にログイン
2. APIキー管理ページへ移動
3. 新しいキーを作成
4. 適切な権限を設定

## 使用例

この記事のように、カスタムスラッグを指定することで、
SEOフレンドリーなURLを作成できます。

**URL例**: `/blog/python-api-guide`""",
            author="API Developer",
            slug="python-api-guide"
        )
        print()
        
        # 3. 記事一覧取得
        posts = client.get_all_posts()
        print()
        
        # 4. 特定記事取得
        if basic_post:
            client.get_post_by_slug(basic_post['slug'])
            print()
        
        # 5. 記事更新
        if custom_post:
            updated_content = custom_post['content'] + "\n\n## 更新情報\n\nこの記事はPython APIクライアントによって更新されました。"
            client.update_post(custom_post['slug'], {'content': updated_content})
            print()
        
        # 6. サンプル記事の一括作成
        print("📚 サンプル記事を一括作成中...")
        sample_posts = create_sample_posts(client)
        print(f"✅ {len(sample_posts)}個のサンプル記事を作成しました")
        print()
        
        # 7. 最終的な記事一覧表示
        print("📊 最終的な記事一覧:")
        final_posts = client.get_all_posts()
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
    
    print("\n✨ すべての処理が完了しました！")
    print("🌐 ブログを確認: http://localhost:3000/blog")

if __name__ == "__main__":
    main()
