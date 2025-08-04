# GitHub Fine-grained Token 設定ガイド

このドキュメントでは、プロジェクトにFine-grained Personal Access Tokenを設定し、GitHub APIを使用する方法を説明します。

## 1. Fine-grained Personal Access Token の作成

### ステップ 1: GitHub設定ページにアクセス
1. GitHubにログイン
2. https://github.com/settings/personal-access-tokens/new にアクセス

### ステップ 2: トークンの基本設定
```
Token name: test-website-api-access
Expiration: 90 days (または適切な期間)
Description: test-websiteプロジェクト用のAPI アクセス
```

### ステップ 3: リポジトリの選択
```
Resource owner: jungamer-64
Repository access: Selected repositories
  └─ jungamer-64/test-website を選択
```

### ステップ 4: 権限の設定
以下の権限を設定してください：

#### Repository permissions
```
✓ Contents: Read and write
✓ Metadata: Read (required)
✓ Pull requests: Read and write
✓ Actions: Read (オプション)
✓ Issues: Read and write (オプション)
```

#### Account permissions
```
Email addresses: Read (オプション)
```

### ステップ 5: トークンの生成
1. "Generate token" をクリック
2. 生成されたトークンをコピー（一度しか表示されません）

## 2. 環境変数の設定

### ステップ 1: .env ファイルの作成
```bash
cp .env.example .env
```

### ステップ 2: GitHub設定の追加
`.env` ファイルに以下を追加：

```env
# GitHub Fine-grained Personal Access Token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub設定
GITHUB_OWNER=jungamer-64
GITHUB_REPO=test-website
GITHUB_API_URL=https://api.github.com
```

## 3. API使用例

### 3.1 リポジトリ情報の取得

```typescript
// app/components/GitHubInfo.tsx
import { useState, useEffect } from 'react';

interface RepoInfo {
  name: string;
  fullName: string;
  description: string;
  isPrivate: boolean;
  htmlUrl: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export function GitHubInfo() {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/github/repository?action=info')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRepoInfo(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div>読み込み中...</div>;
  if (!repoInfo) return <div>データの取得に失敗しました</div>;

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold">{repoInfo.fullName}</h2>
      <p className="text-gray-600">{repoInfo.description}</p>
      <div className="mt-2 text-sm">
        <p>プライベート: {repoInfo.isPrivate ? 'はい' : 'いいえ'}</p>
        <p>デフォルトブランチ: {repoInfo.defaultBranch}</p>
        <p>最終更新: {new Date(repoInfo.updatedAt).toLocaleDateString('ja-JP')}</p>
      </div>
      <a 
        href={repoInfo.htmlUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block mt-2 text-blue-600 hover:underline"
      >
        GitHubで表示
      </a>
    </div>
  );
}
```

### 3.2 コミット履歴の表示

```typescript
// app/components/CommitHistory.tsx
import { useState, useEffect } from 'react';

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  htmlUrl: string;
}

export function CommitHistory() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/github/repository?action=commits&per_page=5')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCommits(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">最新のコミット</h3>
      {commits.map(commit => (
        <div key={commit.sha} className="p-3 border rounded">
          <div className="font-medium">{commit.message}</div>
          <div className="text-sm text-gray-600 mt-1">
            {commit.author.name} • {new Date(commit.author.date).toLocaleDateString('ja-JP')}
          </div>
          <a 
            href={commit.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {commit.sha.substring(0, 7)}
          </a>
        </div>
      ))}
    </div>
  );
}
```

### 3.3 ファイルの作成・更新

```typescript
// app/components/FileEditor.tsx
import { useState } from 'react';

export function FileEditor() {
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/github/repository', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          content,
          message,
          branch: 'master',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('ファイルが正常に作成/更新されました');
        setPath('');
        setContent('');
        setMessage('');
      } else {
        alert('エラー: ' + data.error);
      }
    } catch (error) {
      alert('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          ファイルパス
        </label>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="例: docs/new-file.md"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          ファイル内容
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          コミットメッセージ
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="例: Add new documentation file"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : 'ファイルを作成/更新'}
      </button>
    </form>
  );
}
```

### 3.4 認証状態の確認

```typescript
// app/components/GitHubAuthStatus.tsx
import { useState, useEffect } from 'react';

interface AuthStatus {
  authenticated: boolean;
  scopes: string[];
}

export function GitHubAuthStatus() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    fetch('/api/github/repository?action=auth-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAuthStatus(data.data);
        }
      });
  }, []);

  if (!authStatus) return <div>認証状態を確認中...</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">GitHub認証状態</h3>
      <div className={`p-2 rounded ${authStatus.authenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        状態: {authStatus.authenticated ? '認証済み' : '認証エラー'}
      </div>
      {authStatus.authenticated && authStatus.scopes.length > 0 && (
        <div className="mt-2">
          <div className="text-sm font-medium">利用可能な権限:</div>
          <ul className="text-sm text-gray-600 mt-1">
            {authStatus.scopes.map(scope => (
              <li key={scope}>• {scope}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 4. 利用可能なAPIエンドポイント

### GET /api/github/repository

| パラメータ | 説明 | 例 |
|------------|------|-----|
| action=info | リポジトリ情報を取得 | `/api/github/repository?action=info` |
| action=branches | ブランチ一覧を取得 | `/api/github/repository?action=branches` |
| action=commits | コミット履歴を取得 | `/api/github/repository?action=commits&branch=master&per_page=10` |
| action=content | ファイル/ディレクトリ内容を取得 | `/api/github/repository?action=content&path=README.md` |
| action=auth-status | 認証状態を確認 | `/api/github/repository?action=auth-status` |
| action=rate-limit | レート制限を確認 | `/api/github/repository?action=rate-limit` |

### PUT /api/github/repository
ファイルの作成・更新

```json
{
  "path": "docs/example.md",
  "content": "# Example\n\nThis is an example file.",
  "message": "Add example documentation",
  "branch": "master"
}
```

### DELETE /api/github/repository
ファイルの削除

```json
{
  "path": "docs/example.md",
  "message": "Remove example file",
  "sha": "file_sha_hash",
  "branch": "master"
}
```

## 5. セキュリティのベストプラクティス

### トークンの管理
- `.env`ファイルを`.gitignore`に追加
- 本番環境では環境変数を使用
- 定期的にトークンを更新
- 必要最小限の権限のみ付与

### エラーハンドリング
- APIレスポンスの検証
- レート制限の考慮
- 適切なエラーメッセージの表示

### ログ記録
```typescript
// API呼び出しのログ記録例
console.log('GitHub API call:', {
  action: 'create_file',
  path: path,
  timestamp: new Date().toISOString(),
});
```

## 6. トラブルシューティング

### よくあるエラー

1. **認証エラー (401)**
   - トークンが正しく設定されているか確認
   - トークンの有効期限を確認

2. **権限エラー (403)**
   - 必要な権限が付与されているか確認
   - リポジトリアクセス権限を確認

3. **レート制限 (429)**
   - APIコール頻度を調整
   - レート制限情報を確認: `/api/github/repository?action=rate-limit`

4. **ファイルが見つからない (404)**
   - パスが正しいか確認
   - ブランチが存在するか確認

### デバッグ方法
```typescript
// 認証状態の確認
const authStatus = await fetch('/api/github/repository?action=auth-status');
console.log(await authStatus.json());

// レート制限の確認
const rateLimit = await fetch('/api/github/repository?action=rate-limit');
console.log(await rateLimit.json());
```

これで、Fine-grained Personal Access Tokenを使用したGitHub API連携が完了しました。
