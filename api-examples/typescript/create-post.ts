// Blog API - 記事作成サンプル (TypeScript)
import fetch from 'node-fetch';

// 設定
const API_BASE_URL = 'http://localhost:3000/api';
const API_KEY = 'api_n1npkrgk6tmdqgfpq3'; // 実際のAPIキーに置き換えてください

// 型定義
interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface CreatePostData {
  title: string;
  content: string;
  author: string;
  slug?: string;
}

interface UpdatePostData {
  title?: string;
  content?: string;
  author?: string;
}

class BlogAPIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<{ status: number; data: T | any }> {
    const url = `${this.baseURL}${endpoint}`;
    
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      return {
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 記事を作成
   */
  async createPost(postData: CreatePostData): Promise<Post | null> {
    console.log(`📝 記事作成中: ${postData.title}`);
    
    try {
      const response = await this.makeRequest<ApiResponse<{ post: Post }>>(
        'POST',
        '/posts',
        postData
      );

      if (response.status === 201) {
        const post = response.data.post;
        console.log(`✅ 記事作成成功: ${post.title}`);
        console.log(`🔗 記事URL: http://localhost:3000/blog/${post.slug}`);
        return post;
      } else {
        console.error(`❌ 記事作成失敗:`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ エラー:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 全記事を取得
   */
  async getAllPosts(): Promise<Post[] | null> {
    console.log('📖 記事一覧取得中...');
    
    try {
      const response = await this.makeRequest<ApiResponse<{ posts: Post[] }>>(
        'GET',
        '/posts'
      );

      if (response.status === 200) {
        const posts = response.data.posts;
        console.log(`✅ 記事一覧取得成功`);
        console.log(`📊 総記事数: ${posts.length}`);
        
        posts.forEach((post, index) => {
          console.log(`${index + 1}. ${post.title} (${post.slug})`);
        });
        
        return posts;
      } else {
        console.error(`❌ 記事一覧取得失敗:`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ エラー:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 特定の記事を取得
   */
  async getPostBySlug(slug: string): Promise<Post | null> {
    console.log(`📖 記事取得中: ${slug}`);
    
    try {
      const response = await this.makeRequest<ApiResponse<{ post: Post }>>(
        'GET',
        `/posts/${slug}`
      );

      if (response.status === 200) {
        const post = response.data.post;
        console.log(`✅ 記事取得成功: ${post.title}`);
        console.log(`📝 内容: ${post.content.substring(0, 100)}...`);
        return post;
      } else {
        console.error(`❌ 記事取得失敗:`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ エラー:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 記事を更新
   */
  async updatePost(slug: string, updates: UpdatePostData): Promise<Post | null> {
    console.log(`✏️  記事更新中: ${slug}`);
    
    try {
      const response = await this.makeRequest<ApiResponse<{ post: Post }>>(
        'PUT',
        `/posts/${slug}`,
        updates
      );

      if (response.status === 200) {
        const post = response.data.post;
        console.log(`✅ 記事更新成功: ${post.title}`);
        return post;
      } else {
        console.error(`❌ 記事更新失敗:`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ エラー:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 記事を削除
   */
  async deletePost(slug: string): Promise<boolean> {
    console.log(`🗑️  記事削除中: ${slug}`);
    
    try {
      const response = await this.makeRequest<ApiResponse<{}>>(
        'DELETE',
        `/posts/${slug}`
      );

      if (response.status === 200) {
        console.log(`✅ 記事削除成功: ${slug}`);
        return true;
      } else {
        console.error(`❌ 記事削除失敗:`, response.data);
        return false;
      }
    } catch (error) {
      console.error(`❌ エラー:`, error instanceof Error ? error.message : error);
      return false;
    }
  }
}

/**
 * サンプル記事データ
 */
const getSamplePosts = (): CreatePostData[] => [
  {
    title: 'TypeScript入門ガイド',
    content: `# TypeScript入門ガイド

TypeScriptは、JavaScriptに静的型付けを追加したプログラミング言語です。

## TypeScriptの特徴

### 1. 静的型チェック
\`\`\`typescript
// 型注釈により、コンパイル時にエラーを検出
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

// エラー: Argument of type 'number' is not assignable to parameter of type 'string'
// greet(123);
\`\`\`

### 2. 豊富な型システム
\`\`\`typescript
// インターフェース
interface User {
  id: number;
  name: string;
  email?: string; // オプショナル
}

// ジェネリクス
function identity<T>(arg: T): T {
  return arg;
}

// ユニオン型
type Status = 'loading' | 'success' | 'error';
\`\`\`

### 3. 最新のJavaScript機能
- ES6+ の構文をサポート
- 非同期処理 (async/await)
- デコレータ
- モジュールシステム

## プロジェクトセットアップ

\`\`\`bash
# TypeScript インストール
npm install -g typescript

# プロジェクト初期化
npm init -y
npm install --save-dev typescript @types/node

# tsconfig.json 作成
tsc --init
\`\`\`

## APIクライアントの例

\`\`\`typescript
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`);
    return response.json() as Promise<T>;
  }
}
\`\`\``,
    author: 'TypeScript Expert',
    slug: 'typescript-beginner-guide'
  },
  {
    title: 'モダンJavaScript開発環境',
    content: `# モダンJavaScript開発環境

効率的なJavaScript開発のための環境構築ガイドです。

## 必須ツール

### 1. Node.js & npm
\`\`\`bash
# Node.js バージョン管理
nvm install 18
nvm use 18

# パッケージ管理
npm init -y
npm install express
npm install --save-dev typescript @types/node
\`\`\`

### 2. ビルドツール

#### Vite (推奨)
\`\`\`bash
npm create vite@latest my-app
cd my-app
npm install
npm run dev
\`\`\`

#### Webpack
\`\`\`javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
\`\`\`

### 3. 開発環境

#### VS Code 拡張機能
- TypeScript Hero
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint

#### Prettier設定
\`\`\`json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
\`\`\`

#### ESLint設定
\`\`\`bash
npm install --save-dev eslint
npx eslint --init
\`\`\`

## パッケージマネージャー比較

| 機能 | npm | yarn | pnpm |
|------|-----|------|------|
| 速度 | 標準 | 高速 | 最高速 |
| ディスク使用量 | 多い | 多い | 少ない |
| ロックファイル | package-lock.json | yarn.lock | pnpm-lock.yaml |

## おすすめライブラリ

### ユーティリティ
- **lodash**: データ操作
- **date-fns**: 日付操作
- **axios**: HTTP クライアント

### テスト
- **Jest**: テストフレームワーク
- **@testing-library**: UI テスト
- **Cypress**: E2E テスト`,
    author: 'JavaScript Developer'
  },
  {
    title: 'RESTful API設計原則',
    content: `# RESTful API設計原則

良いAPIを設計するための重要な原則とベストプラクティス。

## REST の基本原則

### 1. リソース指向
すべてのAPIエンドポイントはリソースを中心に設計する。

\`\`\`
// 良い例
GET    /api/users          # ユーザー一覧
POST   /api/users          # ユーザー作成
GET    /api/users/123      # 特定ユーザー取得
PUT    /api/users/123      # ユーザー更新
DELETE /api/users/123      # ユーザー削除

// 悪い例
GET    /api/getUsers
POST   /api/createUser
GET    /api/getUserById/123
\`\`\`

### 2. HTTPメソッドの適切な使用

| メソッド | 用途 | 冪等性 | 安全性 |
|----------|------|--------|--------|
| GET | リソース取得 | ✅ | ✅ |
| POST | リソース作成 | ❌ | ❌ |
| PUT | リソース更新/作成 | ✅ | ❌ |
| PATCH | 部分更新 | ❌ | ❌ |
| DELETE | リソース削除 | ✅ | ❌ |

### 3. 適切なステータスコード

\`\`\`typescript
// 成功レスポンス
200 OK          // 取得・更新成功
201 Created     // 作成成功
204 No Content  // 削除成功

// クライアントエラー
400 Bad Request     // リクエストが不正
401 Unauthorized    // 認証が必要
403 Forbidden       // アクセス権限なし
404 Not Found       // リソースが存在しない
409 Conflict        // リソースの競合

// サーバーエラー
500 Internal Server Error  // サーバー内部エラー
503 Service Unavailable    // サービス利用不可
\`\`\`

## APIレスポンス設計

### 一貫したレスポンス形式
\`\`\`typescript
// 成功レスポンス
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "meta": {
    "timestamp": "2025-07-31T10:00:00Z",
    "requestId": "req_123456"
  }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが不正です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-07-31T10:00:00Z",
    "requestId": "req_123456"
  }
}
\`\`\`

### ページネーション
\`\`\`typescript
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
\`\`\`

## セキュリティ考慮事項

### 1. 認証・認可
\`\`\`typescript
// JWTトークン認証
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// APIキー認証
X-API-Key: your-api-key-here
\`\`\`

### 2. レート制限
\`\`\`typescript
// レスポンスヘッダー
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
\`\`\`

### 3. 入力検証
- すべての入力データを検証
- SQLインジェクション対策
- XSS対策
- CSRFトークンの使用

## APIドキュメント

### OpenAPI仕様書
\`\`\`yaml
openapi: 3.0.0
info:
  title: Blog API
  version: 1.0.0
paths:
  /posts:
    get:
      summary: 記事一覧取得
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  posts:
                    type: array
                    items:
                      $ref: '#/components/schemas/Post'
\`\`\``,
    author: 'API Architect'
  }
];

/**
 * 複数の記事を一括作成
 */
async function createMultiplePosts(client: BlogAPIClient): Promise<Post[]> {
  console.log('📚 複数記事をバッチ作成中...');
  
  const samplePosts = getSamplePosts();
  const createdPosts: Post[] = [];
  
  for (const postData of samplePosts) {
    const post = await client.createPost(postData);
    if (post) {
      createdPosts.push(post);
    }
    
    // レート制限を避けるため、リクエスト間に少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return createdPosts;
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  console.log('🚀 Blog API TypeScript サンプル開始\n');
  
  // APIクライアント初期化
  const client = new BlogAPIClient(API_BASE_URL, API_KEY);
  
  try {
    // 1. 基本的な記事作成
    const basicPost = await client.createPost({
      title: 'TypeScriptで作成した記事',
      content: `# TypeScriptで作成した記事

この記事はTypeScript スクリプトから API を呼び出して作成されました。

## TypeScript の利点

- **型安全性**: コンパイル時にエラーを検出
- **IDE支援**: 優れた補完とリファクタリング
- **大規模開発**: チーム開発に適している

\`\`\`typescript
interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
}

const createPost = async (data: Post): Promise<void> => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create post');
  }
};
\`\`\`

Happy coding with TypeScript! 🚀`,
      author: 'TypeScript Developer'
    });
    console.log();
    
    // 2. カスタムスラッグ付き記事作成
    const customPost = await client.createPost({
      title: 'TypeScript API開発ガイド',
      content: `# TypeScript API開発ガイド

## 型安全なAPI開発

TypeScriptを使用することで、コンパイル時に多くのエラーを検出できます。

\`\`\`typescript
// API レスポンスの型定義
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 型安全なAPIクライアント
class ApiClient {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.data;
  }
}
\`\`\`

この方法により、実行時エラーを大幅に減らすことができます。`,
      author: 'TS API Developer',
      slug: 'typescript-api-development'
    });
    console.log();
    
    // 3. 記事一覧取得
    const posts = await client.getAllPosts();
    console.log();
    
    // 4. 特定記事取得
    if (basicPost) {
      await client.getPostBySlug(basicPost.slug);
      console.log();
    }
    
    // 5. 記事更新
    if (customPost) {
      const updatedContent = customPost.content + `

## 更新情報

この記事はTypeScript APIクライアントによって更新されました。

### 追加のベストプラクティス

1. **エラーハンドリング**: 適切な例外処理を実装
2. **型ガード**: 実行時の型チェック
3. **ジェネリクス**: 再利用可能な型安全なコード

\`\`\`typescript
// 型ガードの例
function isPost(obj: any): obj is Post {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.title === 'string' &&
         typeof obj.content === 'string' &&
         typeof obj.author === 'string';
}
\`\`\``;

      await client.updatePost(customPost.slug, { content: updatedContent });
      console.log();
    }
    
    // 6. サンプル記事の一括作成
    const samplePosts = await createMultiplePosts(client);
    console.log(`✅ ${samplePosts.length}個のサンプル記事を作成しました`);
    console.log();
    
    // 7. 最終的な記事一覧表示
    console.log('📊 最終的な記事一覧:');
    await client.getAllPosts();
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n✨ すべての処理が完了しました！');
  console.log('🌐 ブログを確認: http://localhost:3000/blog');
}

// モジュールとして実行された場合にメイン関数を呼び出し
if (require.main === module) {
  main().catch(console.error);
}

export {
  BlogAPIClient,
  createMultiplePosts,
  getSamplePosts,
  type Post,
  type ApiResponse,
  type CreatePostData,
  type UpdatePostData
};
